
import logging
from flask import Flask
from flask_socketio import SocketIO

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
logging.info("Flask app created.")
socketio = SocketIO(app, cors_allowed_origins="*")
logging.info("SocketIO initialized.")

@socketio.on('connect')
def handle_connect():
    logging.info('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    logging.info('Client disconnected')

if __name__ == '__main__':
    logging.info("Starting simplified server...")
    socketio.run(app, host='0.0.0.0', port=5000)
