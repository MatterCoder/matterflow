from matterflow.node import ConnectionNode, NodeException
from matterflow.parameters import *
import json
import pandas as pd
from matterflow.connection import *
import click
import os 
import socket
import jmespath

class FileWatcherConnectionNode(ConnectionNode):
    """FileWatcherConnectionNode

    Watchs for changes in a file and Reads from the file into a workflow.

    Raises:
         NodeException: any error reading the file, converting
            to workflow.
    """
    name = "FileWatcher Connection (In)"
    num_in = 0
    num_out = 1

    OPTIONS = {
        "file": FileParameter(
            "Test Json",
            default="",
            docstring="Test Json File"
        ),
        "connection": TextParameter(
            "Connection Settings",
            default='{"file_path": "/tmp/test.json", "multiline": false}',
            docstring="Connection Settings Input"
        ),   
        "input": TextParameter(
            "Input Settings",
            default='{"ignore": "" }',
            docstring="Input Settings Input"
        ),   
    }

    def execute(self, predecessor_data, flow_vars):

        connection_settings = json.loads(flow_vars["connection"].get_value())
        multiline = connection_settings["multiline"]

        try:
            # Read from file
            if flow_vars["file"].get_value() == "/tmp/":
                return '{"message":"try uploading a test json file"}'
            else:    
                df = pd.read_json(
                    flow_vars["file"].get_value()
                    , typ='series'
                )
                json_object = json.loads(df.to_json())
                json_data = json_object['0'] #take the first element of the list

                lines = json_data.splitlines("\n")
            
                if multiline:
                    # Process each line as a separate JSON object
                    json_objects = []
                    for line in lines:
                        stripped_line = line.strip()
                        if stripped_line:  # Avoid empty lines
                            json_objects.append(json.loads(stripped_line))
                    
                    # Create a new JSON object that is an array of the JSON objects
                    json_string = json.dumps(json_objects)
                else:
                    # Read entire file as one JSON object
                    json_string = json_data

                    # Check that it's valid JSON by converting it to an object and then back to string
                    json_string = json.dumps(json.loads(json_string))

            return json_string


        except Exception as e:
            print(str(e))
            raise NodeException('File Watcher Connection', str(e))
