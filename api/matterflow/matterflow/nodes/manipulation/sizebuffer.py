from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *
import os
import pandas as pd
import json

class SizeBufferNode(ManipulationNode):
    name = "SizeBuffer"
    num_in = 1
    num_out = 1

    OPTIONS = {
        "bufferSize": IntegerParameter(
            "Size To Buffer", 
            docstring="Size of file to buffer (Bytes)"
        ),
    }

    def execute(self, predecessor_data, flow_vars):

        # use a temporary file to buffer into
        tempFileName = "/tmp/" + self.node_id + "_sizebuffer.json"

        # Read the existing JSONL file
        try:
            with open(tempFileName, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            data = []


        # Append the new JSON object to the list
        data.append(predecessor_data[0])

        # Write the updated list to the JSONL file
        with open(tempFileName, 'w') as f:
            json.dump(data, f)

        # Check the file size
        fileSize = os.path.getsize(tempFileName)
        bufferSize = flow_vars["bufferSize"].get_value()

        # Check if the file size is smaller than the buffer size
        if fileSize < bufferSize:
            #return '[]'
            raise ResourceWarning('Not yet reached buffer size of ' + str(bufferSize) + ' bytes. Currently at ' + str(fileSize) + ' bytes')
        else:
            # Return the entire contents of the file
            with open(tempFileName, 'r') as f:
                jsonObj = json.load(f)

            #remove the buffer file
            os.remove(tempFileName)        
            return json.dumps(jsonObj) #return the jsonObj

    def validate(self):
        """Validate Node configuration

        Checks all Node options and validates all Parameter classes using
        their validation method.

        Raises:
            ValidationError: invalid Parameter value
        """
        super().validate()

