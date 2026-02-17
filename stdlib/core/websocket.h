/**
 * FreeLang stdlib/websocket - WebSocket Protocol (RFC 6455)
 * Full-duplex communication, frame handling, subprotocol support
 */

#ifndef FREELANG_STDLIB_WEBSOCKET_H
#define FREELANG_STDLIB_WEBSOCKET_H

#include <stdint.h>
#include <stddef.h>

/* ===== WebSocket Frame Types ===== */

typedef enum {
  FL_WS_CONTINUATION = 0x0,
  FL_WS_TEXT = 0x1,
  FL_WS_BINARY = 0x2,
  FL_WS_CLOSE = 0x8,
  FL_WS_PING = 0x9,
  FL_WS_PONG = 0xA
} fl_ws_opcode_t;

/* ===== WebSocket Status Codes ===== */

typedef enum {
  FL_WS_CLOSE_NORMAL = 1000,
  FL_WS_CLOSE_GOING_AWAY = 1001,
  FL_WS_CLOSE_PROTOCOL_ERROR = 1002,
  FL_WS_CLOSE_UNSUPPORTED = 1003,
  FL_WS_CLOSE_NO_STATUS = 1005,
  FL_WS_CLOSE_ABNORMAL = 1006,
  FL_WS_CLOSE_INVALID_DATA = 1007,
  FL_WS_CLOSE_SERVER_ERROR = 1011
} fl_ws_close_code_t;

/* ===== WebSocket Frame ===== */

typedef struct {
  int fin;                 /* Final fragment flag */
  fl_ws_opcode_t opcode;   /* Frame type */
  int masked;              /* Data is masked */
  uint8_t mask[4];         /* Masking key */
  uint8_t *payload;        /* Frame data */
  size_t payload_size;     /* Data length */
} fl_ws_frame_t;

/* ===== WebSocket Connection ===== */

typedef struct fl_ws_t fl_ws_t;

typedef void (*fl_ws_on_message_t)(fl_ws_t *ws, fl_ws_opcode_t opcode,
                                   const uint8_t *data, size_t size, void *userdata);
typedef void (*fl_ws_on_close_t)(fl_ws_t *ws, fl_ws_close_code_t code,
                                  const char *reason, void *userdata);

/* ===== WebSocket Statistics ===== */

typedef struct {
  uint64_t frames_sent;
  uint64_t frames_received;
  uint64_t bytes_sent;
  uint64_t bytes_received;
  uint64_t text_frames;
  uint64_t binary_frames;
  uint64_t ping_pongs;
  int is_connected;
} fl_ws_stats_t;

/* ===== Public API ===== */

/* Connection */
fl_ws_t* fl_ws_create_client(const char *url, const char *origin);
fl_ws_t* fl_ws_create_server(int socket_fd);
void fl_ws_destroy(fl_ws_t *ws);

/* Client operations */
int fl_ws_client_connect(fl_ws_t *ws);
int fl_ws_client_send_text(fl_ws_t *ws, const char *text);
int fl_ws_client_send_binary(fl_ws_t *ws, const uint8_t *data, size_t size);
int fl_ws_client_ping(fl_ws_t *ws, const uint8_t *data, size_t size);
int fl_ws_client_close(fl_ws_t *ws, fl_ws_close_code_t code, const char *reason);

/* Server operations */
int fl_ws_server_accept(fl_ws_t *ws);
int fl_ws_server_send_text(fl_ws_t *ws, const char *text);
int fl_ws_server_send_binary(fl_ws_t *ws, const uint8_t *data, size_t size);
int fl_ws_server_ping(fl_ws_t *ws, const uint8_t *data, size_t size);
int fl_ws_server_close(fl_ws_t *ws, fl_ws_close_code_t code, const char *reason);

/* Frame operations */
fl_ws_frame_t* fl_ws_frame_create(fl_ws_opcode_t opcode);
void fl_ws_frame_destroy(fl_ws_frame_t *frame);
int fl_ws_frame_set_payload(fl_ws_frame_t *frame, const uint8_t *data, size_t size);
uint8_t* fl_ws_frame_encode(fl_ws_frame_t *frame, size_t *encoded_size, int mask);
fl_ws_frame_t* fl_ws_frame_decode(const uint8_t *data, size_t size);

/* Callbacks */
int fl_ws_set_on_message(fl_ws_t *ws, fl_ws_on_message_t callback, void *userdata);
int fl_ws_set_on_close(fl_ws_t *ws, fl_ws_on_close_t callback, void *userdata);

/* State */
int fl_ws_is_connected(fl_ws_t *ws);
int fl_ws_is_client(fl_ws_t *ws);
int fl_ws_is_server(fl_ws_t *ws);

/* Statistics */
fl_ws_stats_t* fl_ws_get_stats(fl_ws_t *ws);
void fl_ws_reset_stats(fl_ws_t *ws);

#endif /* FREELANG_STDLIB_WEBSOCKET_H */
