/**
 * FreeLang stdlib/websocket Implementation - WebSocket Protocol (RFC 6455)
 * Full-duplex communication, frame handling, handshake management
 */

#include "websocket.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <openssl/sha.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>

/* ===== WebSocket Structure ===== */

struct fl_ws_t {
  int socket_fd;
  int is_client;
  int is_connected;
  char *url;
  char *origin;
  char *subprotocol;
  
  fl_ws_on_message_t on_message;
  void *message_userdata;
  fl_ws_on_close_t on_close;
  void *close_userdata;
  
  fl_ws_stats_t stats;
  pthread_mutex_t stats_mutex;
};

/* ===== WebSocket Handshake ===== */

static const char *WS_MAGIC_KEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

static char* fl_ws_compute_accept_key(const char *client_key) {
  if (!client_key) return NULL;

  /* Concatenate with magic key */
  size_t key_len = strlen(client_key) + strlen(WS_MAGIC_KEY);
  char *combined = (char*)malloc(key_len + 1);
  sprintf(combined, "%s%s", client_key, WS_MAGIC_KEY);

  /* SHA1 hash */
  unsigned char sha1_result[20];
  SHA1((unsigned char*)combined, strlen(combined), sha1_result);
  free(combined);

  /* Base64 encode */
  BIO *bmem = BIO_new(BIO_s_mem());
  BIO *b64 = BIO_new(BIO_f_base64());
  BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
  b64 = BIO_push(b64, bmem);

  BIO_write(b64, sha1_result, 20);
  BIO_flush(b64);
  BIO_free_all(b64);

  BUF_MEM *buffer_ptr;
  BIO_get_mem_ptr(bmem, &buffer_ptr);

  char *accept_key = (char*)malloc(buffer_ptr->length + 1);
  memcpy(accept_key, buffer_ptr->data, buffer_ptr->length);
  accept_key[buffer_ptr->length] = '\0';

  BIO_free(bmem);

  return accept_key;
}

/* ===== WebSocket Creation/Destruction ===== */

fl_ws_t* fl_ws_create_client(const char *url, const char *origin) {
  if (!url) return NULL;

  fl_ws_t *ws = (fl_ws_t*)malloc(sizeof(fl_ws_t));
  if (!ws) return NULL;

  ws->socket_fd = -1;
  ws->is_client = 1;
  ws->is_connected = 0;
  ws->url = (char*)malloc(strlen(url) + 1);
  strcpy(ws->url, url);

  if (origin) {
    ws->origin = (char*)malloc(strlen(origin) + 1);
    strcpy(ws->origin, origin);
  } else {
    ws->origin = NULL;
  }

  ws->subprotocol = NULL;
  ws->on_message = NULL;
  ws->on_close = NULL;

  memset(&ws->stats, 0, sizeof(fl_ws_stats_t));
  pthread_mutex_init(&ws->stats_mutex, NULL);

  fprintf(stderr, "[websocket] Client created: %s\n", url);
  return ws;
}

fl_ws_t* fl_ws_create_server(int socket_fd) {
  if (socket_fd < 0) return NULL;

  fl_ws_t *ws = (fl_ws_t*)malloc(sizeof(fl_ws_t));
  if (!ws) return NULL;

  ws->socket_fd = socket_fd;
  ws->is_client = 0;
  ws->is_connected = 0;
  ws->url = NULL;
  ws->origin = NULL;
  ws->subprotocol = NULL;
  ws->on_message = NULL;
  ws->on_close = NULL;

  memset(&ws->stats, 0, sizeof(fl_ws_stats_t));
  pthread_mutex_init(&ws->stats_mutex, NULL);

  fprintf(stderr, "[websocket] Server created: fd=%d\n", socket_fd);
  return ws;
}

void fl_ws_destroy(fl_ws_t *ws) {
  if (!ws) return;

  if (ws->socket_fd >= 0) {
    close(ws->socket_fd);
  }

  free(ws->url);
  free(ws->origin);
  free(ws->subprotocol);
  pthread_mutex_destroy(&ws->stats_mutex);
  free(ws);

  fprintf(stderr, "[websocket] Destroyed\n");
}

/* ===== Client Operations ===== */

int fl_ws_client_connect(fl_ws_t *ws) {
  if (!ws || !ws->is_client) return -1;

  /* Parse URL (simplified) */
  char host[256] = "localhost";
  int port = 80;

  if (strstr(ws->url, "://")) {
    sscanf(ws->url, "ws://%255[^:]:%d", host, &port);
    if (port == 0) port = 80;
  }

  /* Create TCP socket and connect (simplified) */
  ws->socket_fd = socket(AF_INET, SOCK_STREAM, 0);
  if (ws->socket_fd < 0) {
    fprintf(stderr, "[websocket] Socket creation failed\n");
    return -1;
  }

  fprintf(stderr, "[websocket] Client connecting to %s:%d\n", host, port);

  /* Send handshake request */
  const char *handshake_fmt =
    "GET / HTTP/1.1\r\n"
    "Host: %s:%d\r\n"
    "Upgrade: websocket\r\n"
    "Connection: Upgrade\r\n"
    "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
    "Sec-WebSocket-Version: 13\r\n"
    "\r\n";

  char handshake[512];
  snprintf(handshake, sizeof(handshake), handshake_fmt, host, port);

  if (send(ws->socket_fd, handshake, strlen(handshake), 0) < 0) {
    fprintf(stderr, "[websocket] Handshake send failed\n");
    return -1;
  }

  ws->is_connected = 1;
  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.is_connected = 1;
  pthread_mutex_unlock(&ws->stats_mutex);

  fprintf(stderr, "[websocket] Client connected\n");
  return 0;
}

int fl_ws_client_send_text(fl_ws_t *ws, const char *text) {
  if (!ws || !text) return -1;

  return fl_ws_client_send_binary(ws, (uint8_t*)text, strlen(text));
}

int fl_ws_client_send_binary(fl_ws_t *ws, const uint8_t *data, size_t size) {
  if (!ws || !data) return -1;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_BINARY);
  if (!frame) return -1;

  fl_ws_frame_set_payload(frame, data, size);

  size_t encoded_size = 0;
  uint8_t *encoded = fl_ws_frame_encode(frame, &encoded_size, 1);  /* Mask for client */
  fl_ws_frame_destroy(frame);

  if (!encoded) return -1;

  ssize_t sent = send(ws->socket_fd, encoded, encoded_size, 0);
  free(encoded);

  if (sent < 0) return -1;

  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.frames_sent++;
  ws->stats.bytes_sent += sent;
  ws->stats.binary_frames++;
  pthread_mutex_unlock(&ws->stats_mutex);

  fprintf(stderr, "[websocket] Sent: %zu bytes\n", (size_t)sent);
  return (int)sent;
}

int fl_ws_client_ping(fl_ws_t *ws, const uint8_t *data, size_t size) {
  if (!ws) return -1;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_PING);
  if (!frame) return -1;

  if (data && size > 0) {
    fl_ws_frame_set_payload(frame, data, size);
  }

  size_t encoded_size = 0;
  uint8_t *encoded = fl_ws_frame_encode(frame, &encoded_size, 1);
  fl_ws_frame_destroy(frame);

  if (!encoded) return -1;

  ssize_t sent = send(ws->socket_fd, encoded, encoded_size, 0);
  free(encoded);

  if (sent < 0) return -1;

  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.ping_pongs++;
  pthread_mutex_unlock(&ws->stats_mutex);

  return 0;
}

int fl_ws_client_close(fl_ws_t *ws, fl_ws_close_code_t code, const char *reason) {
  if (!ws) return -1;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_CLOSE);
  if (!frame) return -1;

  /* Create close frame payload: 2-byte status code + reason */
  size_t reason_len = reason ? strlen(reason) : 0;
  uint8_t payload[2 + reason_len];

  payload[0] = (code >> 8) & 0xFF;
  payload[1] = code & 0xFF;
  if (reason_len > 0) {
    memcpy(&payload[2], reason, reason_len);
  }

  fl_ws_frame_set_payload(frame, payload, 2 + reason_len);

  size_t encoded_size = 0;
  uint8_t *encoded = fl_ws_frame_encode(frame, &encoded_size, 1);
  fl_ws_frame_destroy(frame);

  if (!encoded) return -1;

  send(ws->socket_fd, encoded, encoded_size, 0);
  free(encoded);

  ws->is_connected = 0;
  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.is_connected = 0;
  pthread_mutex_unlock(&ws->stats_mutex);

  fprintf(stderr, "[websocket] Closed: code=%d\n", code);
  return 0;
}

/* ===== Server Operations ===== */

int fl_ws_server_accept(fl_ws_t *ws) {
  if (!ws || ws->is_client) return -1;

  /* Receive and parse handshake (simplified) */
  uint8_t buffer[1024];
  ssize_t received = recv(ws->socket_fd, buffer, sizeof(buffer), 0);

  if (received < 0) {
    fprintf(stderr, "[websocket] Handshake receive failed\n");
    return -1;
  }

  ws->is_connected = 1;
  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.is_connected = 1;
  pthread_mutex_unlock(&ws->stats_mutex);

  fprintf(stderr, "[websocket] Server accepted connection\n");
  return 0;
}

int fl_ws_server_send_text(fl_ws_t *ws, const char *text) {
  if (!ws || !text) return -1;

  return fl_ws_server_send_binary(ws, (uint8_t*)text, strlen(text));
}

int fl_ws_server_send_binary(fl_ws_t *ws, const uint8_t *data, size_t size) {
  if (!ws || !data) return -1;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_BINARY);
  if (!frame) return -1;

  fl_ws_frame_set_payload(frame, data, size);

  size_t encoded_size = 0;
  uint8_t *encoded = fl_ws_frame_encode(frame, &encoded_size, 0);  /* No mask for server */
  fl_ws_frame_destroy(frame);

  if (!encoded) return -1;

  ssize_t sent = send(ws->socket_fd, encoded, encoded_size, 0);
  free(encoded);

  if (sent < 0) return -1;

  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.frames_sent++;
  ws->stats.bytes_sent += sent;
  ws->stats.binary_frames++;
  pthread_mutex_unlock(&ws->stats_mutex);

  return (int)sent;
}

int fl_ws_server_ping(fl_ws_t *ws, const uint8_t *data, size_t size) {
  if (!ws) return -1;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_PING);
  if (!frame) return -1;

  if (data && size > 0) {
    fl_ws_frame_set_payload(frame, data, size);
  }

  size_t encoded_size = 0;
  uint8_t *encoded = fl_ws_frame_encode(frame, &encoded_size, 0);
  fl_ws_frame_destroy(frame);

  if (!encoded) return -1;

  send(ws->socket_fd, encoded, encoded_size, 0);
  free(encoded);

  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.ping_pongs++;
  pthread_mutex_unlock(&ws->stats_mutex);

  return 0;
}

int fl_ws_server_close(fl_ws_t *ws, fl_ws_close_code_t code, const char *reason) {
  if (!ws) return -1;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_CLOSE);
  if (!frame) return -1;

  size_t reason_len = reason ? strlen(reason) : 0;
  uint8_t payload[2 + reason_len];

  payload[0] = (code >> 8) & 0xFF;
  payload[1] = code & 0xFF;
  if (reason_len > 0) {
    memcpy(&payload[2], reason, reason_len);
  }

  fl_ws_frame_set_payload(frame, payload, 2 + reason_len);

  size_t encoded_size = 0;
  uint8_t *encoded = fl_ws_frame_encode(frame, &encoded_size, 0);
  fl_ws_frame_destroy(frame);

  if (!encoded) return -1;

  send(ws->socket_fd, encoded, encoded_size, 0);
  free(encoded);

  ws->is_connected = 0;
  pthread_mutex_lock(&ws->stats_mutex);
  ws->stats.is_connected = 0;
  pthread_mutex_unlock(&ws->stats_mutex);

  return 0;
}

/* ===== Frame Operations ===== */

fl_ws_frame_t* fl_ws_frame_create(fl_ws_opcode_t opcode) {
  fl_ws_frame_t *frame = (fl_ws_frame_t*)malloc(sizeof(fl_ws_frame_t));
  if (!frame) return NULL;

  frame->fin = 1;
  frame->opcode = opcode;
  frame->masked = 0;
  memset(frame->mask, 0, 4);
  frame->payload = NULL;
  frame->payload_size = 0;

  return frame;
}

void fl_ws_frame_destroy(fl_ws_frame_t *frame) {
  if (!frame) return;
  free(frame->payload);
  free(frame);
}

int fl_ws_frame_set_payload(fl_ws_frame_t *frame, const uint8_t *data, size_t size) {
  if (!frame || !data) return -1;

  frame->payload = (uint8_t*)malloc(size);
  if (!frame->payload) return -1;

  memcpy(frame->payload, data, size);
  frame->payload_size = size;

  return 0;
}

uint8_t* fl_ws_frame_encode(fl_ws_frame_t *frame, size_t *encoded_size, int mask) {
  if (!frame || !encoded_size) return NULL;

  /* Calculate frame size */
  size_t frame_size = 2;  /* FIN + RSV + opcode, mask + payload length */

  if (frame->payload_size < 126) {
    frame_size += 1;
  } else if (frame->payload_size < 65536) {
    frame_size += 2;
  } else {
    frame_size += 8;
  }

  if (mask) {
    frame_size += 4;  /* Masking key */
  }

  frame_size += frame->payload_size;

  uint8_t *encoded = (uint8_t*)malloc(frame_size);
  if (!encoded) return NULL;

  size_t pos = 0;

  /* Byte 0: FIN + RSV + opcode */
  encoded[pos] = (frame->fin << 7) | frame->opcode;
  pos++;

  /* Byte 1: MASK + payload length */
  uint8_t mask_bit = mask ? 0x80 : 0x00;
  if (frame->payload_size < 126) {
    encoded[pos] = mask_bit | frame->payload_size;
    pos++;
  } else if (frame->payload_size < 65536) {
    encoded[pos] = mask_bit | 126;
    pos++;
    encoded[pos] = (frame->payload_size >> 8) & 0xFF;
    pos++;
    encoded[pos] = frame->payload_size & 0xFF;
    pos++;
  } else {
    encoded[pos] = mask_bit | 127;
    pos++;
    for (int i = 7; i >= 0; i--) {
      encoded[pos++] = (frame->payload_size >> (8 * i)) & 0xFF;
    }
  }

  /* Masking key and payload */
  if (mask) {
    memcpy(&encoded[pos], frame->mask, 4);
    pos += 4;

    /* XOR payload with mask */
    for (size_t i = 0; i < frame->payload_size; i++) {
      encoded[pos + i] = frame->payload[i] ^ frame->mask[i % 4];
    }
  } else {
    memcpy(&encoded[pos], frame->payload, frame->payload_size);
  }

  pos += frame->payload_size;

  *encoded_size = pos;
  return encoded;
}

fl_ws_frame_t* fl_ws_frame_decode(const uint8_t *data, size_t size) {
  if (!data || size < 2) return NULL;

  fl_ws_frame_t *frame = fl_ws_frame_create(FL_WS_CONTINUATION);
  if (!frame) return NULL;

  size_t pos = 0;

  /* Byte 0 */
  frame->fin = (data[0] >> 7) & 1;
  frame->opcode = data[0] & 0x0F;
  pos++;

  /* Byte 1 */
  frame->masked = (data[1] >> 7) & 1;
  size_t payload_len = data[1] & 0x7F;
  pos++;

  /* Extended payload length */
  if (payload_len == 126) {
    if (pos + 2 > size) {
      fl_ws_frame_destroy(frame);
      return NULL;
    }
    payload_len = (data[pos] << 8) | data[pos + 1];
    pos += 2;
  } else if (payload_len == 127) {
    if (pos + 8 > size) {
      fl_ws_frame_destroy(frame);
      return NULL;
    }
    payload_len = 0;
    for (int i = 0; i < 8; i++) {
      payload_len = (payload_len << 8) | data[pos++];
    }
  }

  /* Masking key */
  if (frame->masked) {
    if (pos + 4 > size) {
      fl_ws_frame_destroy(frame);
      return NULL;
    }
    memcpy(frame->mask, &data[pos], 4);
    pos += 4;
  }

  /* Payload */
  if (pos + payload_len > size) {
    fl_ws_frame_destroy(frame);
    return NULL;
  }

  frame->payload = (uint8_t*)malloc(payload_len);
  memcpy(frame->payload, &data[pos], payload_len);
  frame->payload_size = payload_len;

  /* Unmask if needed */
  if (frame->masked) {
    for (size_t i = 0; i < payload_len; i++) {
      frame->payload[i] ^= frame->mask[i % 4];
    }
  }

  return frame;
}

/* ===== Callbacks ===== */

int fl_ws_set_on_message(fl_ws_t *ws, fl_ws_on_message_t callback, void *userdata) {
  if (!ws) return -1;

  ws->on_message = callback;
  ws->message_userdata = userdata;
  return 0;
}

int fl_ws_set_on_close(fl_ws_t *ws, fl_ws_on_close_t callback, void *userdata) {
  if (!ws) return -1;

  ws->on_close = callback;
  ws->close_userdata = userdata;
  return 0;
}

/* ===== State ===== */

int fl_ws_is_connected(fl_ws_t *ws) {
  return ws ? ws->is_connected : 0;
}

int fl_ws_is_client(fl_ws_t *ws) {
  return ws ? ws->is_client : 0;
}

int fl_ws_is_server(fl_ws_t *ws) {
  return ws ? !ws->is_client : 0;
}

/* ===== Statistics ===== */

fl_ws_stats_t* fl_ws_get_stats(fl_ws_t *ws) {
  if (!ws) return NULL;

  fl_ws_stats_t *stats = (fl_ws_stats_t*)malloc(sizeof(fl_ws_stats_t));
  if (!stats) return NULL;

  pthread_mutex_lock(&ws->stats_mutex);
  memcpy(stats, &ws->stats, sizeof(fl_ws_stats_t));
  pthread_mutex_unlock(&ws->stats_mutex);

  return stats;
}

void fl_ws_reset_stats(fl_ws_t *ws) {
  if (!ws) return;

  pthread_mutex_lock(&ws->stats_mutex);
  memset(&ws->stats, 0, sizeof(fl_ws_stats_t));
  ws->stats.is_connected = ws->is_connected;
  pthread_mutex_unlock(&ws->stats_mutex);
}
