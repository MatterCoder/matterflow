from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *
import os
import pandas as pd
import json
import time

class TimeBufferNode(ManipulationNode):
    """TimeBuffer

    Buffers the incoming json into a buffer until the time duration to buffer (seconds) is reached.

    Raises:
        NodeException: any error buffering Json files, converting
            from json data.
    """

    name = "TimeBuffer"
    num_in = 1
    num_out = 1

    OPTIONS = {
        "bufferTime": IntegerParameter(
            "Time To Buffer",
            default=0,
            docstring="Time duration to buffer (seconds)"
        ),
    }

    def execute(self, predecessor_data, flow_vars):
        # Ignore any predecessor data that was rejected by preceding nodes
        if 'meta' in predecessor_data[0] and predecessor_data[0]['meta']['status'] == 'rejected':
            return predecessor_data[0]

        # Define the temporary file for buffering
        DIR_PATH = os.getenv('DIR_PATH') or '/tmp'
        tempFileName = DIR_PATH + "/" + self.node_id + "_timebuffer.json"

        # Read the existing JSONL file or initialize an empty buffer
        try:
            with open(tempFileName, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            data = []

        # Append the new JSON object to the list
        data.append(predecessor_data[0])

        # Determine when the file was created or last modified
        if os.path.exists(tempFileName):
            file_creation_time = os.path.getmtime(tempFileName)  # File's last modified time
        else:
            file_creation_time = time.time()  # Fallback (unlikely to be used)

        # Write the updated list to the JSONL file
        with open(tempFileName, 'w') as f:
            json.dump(data, f)

        # Get the current time and buffer duration
        current_time = time.time()
        buffer_time = flow_vars["bufferTime"].get_value()

        # Check if the buffer duration has elapsed
        elapsed_time = int(current_time - file_creation_time)  # Elapsed time in seconds
        if elapsed_time < buffer_time:
            raise ResourceWarning(
                f"Not yet reached buffer time of {buffer_time} seconds. "
                f"Elapsed time: {elapsed_time} seconds"
            )
        else:
            # Return the entire contents of the buffer
            with open(tempFileName, 'r') as f:
                jsonObj = json.load(f)

            # Remove the buffer file
            os.remove(tempFileName)
            return json.dumps(jsonObj)  # Return the buffered data

    def validate(self):
        """Validate Node configuration

        Checks all Node options and validates all Parameter classes using
        their validation method.

        Raises:
            ValidationError: invalid Parameter value
        """
        super().validate()