import json
connection_settings_string = '{"host": "localhost", "port": 1883, "keepalive": 60, "username": "mqtt_user", "password": "mqtt_password"}'
print(connection_settings_string)
connection_settings = json.loads(connection_settings_string)

print(connection_settings)
exit(0)

'''
import paho.mqtt.client as mqtt

broker_address="localhost" 
#broker_address="iot.eclipse.org" #use external broker
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "P1") #create new instance
client.connect(broker_address) #connect to broker
client.publish("home/lights/kids_bedroom","On") #publish
'''

import paho.mqtt.client as mqtt #import the client1
import time
############
def on_message(client, userdata, message):
    print("message received " ,str(message.payload.decode("utf-8")))
    print("message topic=",message.topic)
    print("message qos=",message.qos)
    print("message retain flag=",message.retain)
########################################
broker_address="localhost" 
print("creating new instance")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "P1") #create new instance
client.on_message=on_message #attach function to callback
print("connecting to broker")
client.connect(broker_address) #connect to broker
client.loop_start() #start the loop
print("Subscribing to topic","home/lights/kids_bedroom")
client.subscribe("home/lights/kids_bedroom")
time.sleep(4) # wait
client.loop_stop() #stop the loop