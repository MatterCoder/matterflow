from abc import ABC, abstractmethod
from queue import Queue, Empty
import json
import pickle
import time 
import asyncio
import aiohttp
import aiomqtt
import sys
import random
import os
import aiofiles

class InputQueue(asyncio.PriorityQueue):
    def _put(self, item):
        priority = 2
        if item.topic.matches("humidity/#"):  # Assign priority
            priority = 1
        super()._put((priority, item))

    def _get(self):
        return super()._get()[1]

class MemQueue(asyncio.Queue):
    def __init__(self, maxsize=0, maxmemsize=0,refresh_interval=1.0, refresh_timeout=60):
        super().__init__(maxsize)
        self.maxmemsize = maxmemsize
        self.refresh_interval = refresh_interval
        self.refresh_timeout = refresh_timeout

    async def put(self, item):
        item_size = sys.getsizeof(item)

    	# specific locking code (see original class in GitHub)
        super().put_nowait((item_size, item))

    def put_nowait(self, item):
        item_size = sys.getsizeof(item)
        
        if self.full(item_size):
            raise asyncio.QueueFull
        super().put_nowait((item_size, item))

class BaseConnection(ABC):

    # create the shared queue for sharing inbound messages between webserver and websocket queues
    # queue of 5 MiB max, and 1000 items max
    _queue = MemQueue(maxsize=1000, maxmemsize=5*1024*1024)

    def __init__(self, connection_settings, input_settings, output_settings):
        self.connection_settings = connection_settings
        self.input_settings = input_settings
        self.output_settings = output_settings

    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def disconnect(self):
        pass

    @abstractmethod
    def read_input(self):
        """Reads input from the connection and returns it."""
        pass

    @abstractmethod
    def send_output(self, data):
        """Sends data to the connection."""
        pass

    def get_connection_settings(self):
        return self.connection_settings

    def set_connection_settings(self, settings):
        self.connection_settings.update(settings)

    def get_input_settings(self):
        return self.input_settings

    def set_input_settings(self, settings):
        self.input_settings.update(settings)

    def get_output_settings(self):
        return self.output_settings

    def set_output_settings(self, settings):
        self.output_settings.update(settings)

class FileWatcherConnection(BaseConnection):
    def __init__(self, connection_settings, input_settings, output_settings):
        super().__init__(connection_settings, input_settings, output_settings)
        self.file_path = connection_settings.get('file_path')
        self.last_modified_time = None

    async def connect(self):
        if not self.file_path or not os.path.isfile(self.file_path):
            raise FileNotFoundError(f"File not found: {self.file_path}")
        self.last_modified_time = os.path.getmtime(self.file_path)
        print(f"Monitoring file: {self.file_path}")

    async def disconnect(self):
        print("Stopped monitoring the file.")

    async def read_input(self):
        while True:
            current_modified_time = os.path.getmtime(self.file_path)
            if current_modified_time != self.last_modified_time:
                self.last_modified_time = current_modified_time
                async with aiofiles.open(self.file_path, 'r', encoding='utf-8') as file:
                    contents = await file.read()
                    print("File change detected, reading new contents.")

                    return contents

            # Wait for a short period before checking again
            await asyncio.sleep(1)

    async def send_output(self, data):
        print("FileWatcherConnection does not support sending output.")

class WebhookConnection(BaseConnection):
    def connect(self):
        # Implementation specific to Webhook Connection
        print("Webhook connection established.")

    def disconnect(self):
        # Implementation specific to Webhook Connection
        print("Webhook connection closed.")

    def read_input(self):
        # Implementation specific to Webhook Connection
        return "Webhook input data"

    def send_output(self, data):
        # Implementation specific to Webhook Connection
        print(f"Sending data to Webhook: {data}")

class CSVConnection(BaseConnection):
    def connect(self):
        # Implementation specific to CSV Connection
        print("CSV connection established.")

    def disconnect(self):
        # Implementation specific to CSV Connection
        print("CSV connection closed.")

    def read_input(self):
        # Implementation specific to Webhook Connection
        return "Webhook input data"

    def send_output(self, data):
        # Implementation specific to Webhook Connection
        print(f"Sending data to Webhook: {data}")

class MQTTConnection(BaseConnection):
    def __init__(self, connection_settings, input_settings, output_settings):
        super().__init__(connection_settings, input_settings, output_settings)
        self.message_queue = asyncio.Queue()
        self.client = None

    async def connect(self):
        """Set up MQTT client and connect to the broker."""
        # Connect to the MQTT broker
        async with aiomqtt.Client(self.connection_settings["host"], self.connection_settings["port"]) as client:
            self.client = client

            #Subscribe to topics
            if "topics" in self.input_settings:
                for topic in self.input_settings["topics"]:
                    await client.subscribe(topic)

            print("MQTT connection established.")

            async with asyncio.TaskGroup() as tg:
                """Asynchronously listen for messages and enqueue them."""
                async for message in client.messages:
                    print(f"Received message from topic {message.topic}")
                    message_data = {"topic": str(message.topic), "payload": message.payload.decode()}
                    tg.create_task(self._queue.put(message_data))  # Spawn new coroutine

            # simulate i/o operation using sleep
            await asyncio.sleep(random.random())


    async def disconnect(self):
        """Disconnect from the MQTT broker."""
        await self.client.disconnect()
        print("MQTT connection closed.")

    async def read_input(self):
        """Retrieve messages from the queue asynchronously."""
        while True:
            # get a unit of work
            Item_size, item = await self._queue.get()
            if item is None:
                break
            # report

            # Notify the queue that the "work item" has been processed.
            self._queue.task_done()

            # simulate i/o operation using sleep
            await asyncio.sleep(0.1)

            return item
        
    async def send_output(self, data):
        # Connect to the MQTT broker
        async with aiomqtt.Client(self.connection_settings["host"], self.connection_settings["port"]) as client:
            """Publish a message to a specific topic."""
            topic = data.get("topic", self.output_settings.get("default_topic"))
            payload = data.get("payload")
            qos = data.get("qos", 0)
            retain = data.get("retain", False)

            if topic and payload:
                await client.publish(topic, payload, qos=qos, retain=retain)
                print(f"Published data to MQTT topic {topic}: {payload}")
            else:
                print("Invalid output data for MQTT publish. Missing 'topic' or 'payload'.")


            print("MQTT connection established.")


class WebsocketConnection(BaseConnection):
    def __init__(self, connection_settings, input_settings, output_settings):
        super().__init__(connection_settings, input_settings, output_settings)
        self.client = None
        self.input_data = None

    async def connect(self):
        URL = f'http://{self.connection_settings["host"]}:{self.connection_settings["port"]}/ws'
        async with aiohttp.ClientSession().ws_connect(URL) as ws:
            self.client = ws 

            print("Websocket connection established.")

            try:
                rand_message_id = str(random.randint(1, 9999999) )
                message_object = {
                    "message_id": rand_message_id,
                    "command": "start_listening"
                }
                
                print("Starting to Listen - Sending command")
                await ws.send_str(json.dumps(message_object))
            except:
                print("Connect Listening Set Up Error")        

            async with asyncio.TaskGroup() as tg:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        message_response = msg.json()
                        print("got message from ws sending to queue")
                        #print(message_response)
                        tg.create_task(self._queue.put(message_response))  # Spawn new coroutine


            # simulate i/o operation using sleep
            await asyncio.sleep(random.random())

    async def disconnect(self):
        await self.client.disconnect()
        print("Websocket connection closed.")


    async def read_input(self):
        while True:
            # get a unit of work
            Item_size, item = await self._queue.get()
            if item is None:
                break
            # report

            # Notify the queue that the "work item" has been processed.
            self._queue.task_done()

            # simulate i/o operation using sleep
            await asyncio.sleep(0.1)

            return item

    async def send_output(self, data):
        URL = f'http://{self.connection_settings["host"]}:{self.connection_settings["port"]}/ws'
        async with aiohttp.ClientSession().ws_connect(URL) as ws:
            self.client = ws 

            print("Websocket connection established.")
            await ws.send_str(item)
        print(f"Published data to Websocket: {item}")


class RESTClientConnection(BaseConnection):
    def connect(self):
        # Implementation specific to REST Client Connection
        print("REST Client connection established.")

    def disconnect(self):
        # Implementation specific to REST Client Connection
        print("REST Client connection closed.")

    def read_input(self):
        # Implementation specific to Webhook Connection
        return "Webhook input data"

    def send_output(self, data):
        # Implementation specific to Webhook Connection
        print(f"Sending data to Webhook: {data}")

class JDBCDriverConnection(BaseConnection):
    def connect(self):
        # Implementation specific to JDBC Driver Connection
        print("JDBC Driver connection established.")

    def disconnect(self):
        # Implementation specific to JDBC Driver Connection
        print("JDBC Driver connection closed.")

    def read_input(self):
        # Implementation specific to Webhook Connection
        return "Webhook input data"

    def send_output(self, data):
        # Implementation specific to Webhook Connection
        print(f"Sending data to Webhook: {data}")

class AmazonS3Connection(BaseConnection):
    def connect(self):
        # Implementation specific to Amazon S3 Connection
        print("Amazon S3 connection established.")

    def disconnect(self):
        # Implementation specific to Amazon S3 Connection
        print("Amazon S3 connection closed.")

    def read_input(self):
        # Implementation specific to Webhook Connection
        return "Webhook input data"

    def send_output(self, data):
        # Implementation specific to Webhook Connection
        print(f"Sending data to Webhook: {data}")

class FileConnection(BaseConnection):
    def connect(self):
        # Implementation specific to File Connection
        print("File connection established.")

    def disconnect(self):
        # Implementation specific to File Connection
        print("File connection closed.")

    def read_input(self):
        # Implementation specific to Webhook Connection
        return "Webhook input data"

    def send_output(self, data):
        # Implementation specific to Webhook Connection
        print(f"Sending data to Webhook: {data}")

class ConnectionFactory:
    @staticmethod
    def create_connection(connection_type, connection_settings, input_settings, output_settings):
        if connection_type == "Websocket":
            return WebsocketConnection(connection_settings, input_settings, output_settings)
        elif connection_type == "Mqtt":
            return MQTTConnection(connection_settings, input_settings, output_settings)
        elif connection_type == "FileWatcher":
            return FileWatcherConnection(connection_settings, input_settings, output_settings)
        else:
            raise ValueError(f"Unknown connection type: {connection_type}")




async def useWsConnectionForConsuming(websocket_connection_settings, websocket_input_settings, websocket_output_settings):
    websocket_connection = ConnectionFactory.create_connection("Websocket", websocket_connection_settings, websocket_input_settings, websocket_output_settings)

    print("started useWsConnectionForConsuming")
    await websocket_connection.connect()

async def useWsConnectionForReading(websocket_connection_settings, websocket_input_settings, websocket_output_settings):
    websocket_connection = ConnectionFactory.create_connection("Websocket", websocket_connection_settings, websocket_input_settings, websocket_output_settings)
    print("started useWsConnectionForReading")

    while True:
        message = await websocket_connection.read_input()
        print("received message:")
        print(message)
        await asyncio.sleep(0.1)

async def useMqttConnectionForConsuming(filenames, verbose, mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings):
    mqtt_connection = ConnectionFactory.create_connection("Mqtt", mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings)

    print("started useMqttConnectionForConsuming")
    await mqtt_connection.connect()

async def useMqttConnectionForReading(filenames, verbose, mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings):
    mqtt_connection = ConnectionFactory.create_connection("Mqtt", mqtt_connection_settings, mqtt_input_settings, mqtt_output_settings)
    print("started useMqttConnectionForReading")

    while True:
        message = await mqtt_connection.read_input()
        input = json.dumps(message)
        in_stream = io.BytesIO(input.encode('utf-8'))
        sys.stdin = io.TextIOWrapper(in_stream, encoding='utf-8')        
        await execute_async(filenames, verbose)
        await asyncio.sleep(0.1)


async def run_all_ws_flows(connection_settings, input_settings, output_settings):
    """ Start concurrent tasks and join  together """
    print("Begin to start tasks...")
    results = []

    async with asyncio.TaskGroup() as tasks:
        tasks.create_task(useWsConnectionForConsuming(connection_settings, input_settings, output_settings))
        tasks.create_task(useWsConnectionForReading(connection_settings, input_settings, output_settings))

    print(f"All flows done")

    return results

'''
The code below is only used for individual file testing
'''
def main():

    # Example usage "WS"
    websocket_connection_settings = {
        "Client ID": "client123",
        "Connection Timeout": 60,
        "Keep Alive": 120,
        "host": "127.0.0.1",
        "port": 5580,
        "Clean Session": True
    }
    websocket_input_settings = {
        "Topic": "#",
        "Include Topic": True,
        "Payload Type": "JSON"
    }
    websocket_output_settings = {
        "Topic": "sensors/response",
        "QoS": 1,
        "Named Root": "sensor_data",
        "Retain": False,
        "Breakup Arrays": False,
        "Template": "{temperature}",
        "AWS IoT Core": False
    }    
    asyncio.run(run_all_ws_flows(websocket_connection_settings, websocket_input_settings,websocket_output_settings))


if __name__ == "__main__":
    main()