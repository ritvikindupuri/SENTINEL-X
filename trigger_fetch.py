import socketio
import time

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')
    sio.emit('save_credentials', {'username': 'user', 'password': 'password'})
    print('credentials sent')

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://localhost:5000')
time.sleep(10) # Wait for data to be processed
sio.disconnect()
