# chat/consumers.py
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
from channels.layers import get_channel_layer
import fileinput
from datetime import datetime
from datetime import timedelta

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'videochat'
        
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()
        

    def disconnect(self, close_code):
        # self.send(text_data=json.dumps({
        #     'message': 'exits',
        #     'who': 'a',
        # }))
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        



    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        who = text_data_json['who']
        print(message)

        
        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'who': who,
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']
        who = event['who']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message,
            'who': who,

        }))