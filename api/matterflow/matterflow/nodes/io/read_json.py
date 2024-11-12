from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import pandas as pd
import json

class ReadJsonNode(IONode):
    """ReadJsonNode

    Reads a Json file into a workflow.

    Raises:
         NodeException: any error reading json file, converting
            to workflow.
    """
    name = "Read Json"
    num_in = 0
    num_out = 1

    OPTIONS = {
        "file": FileParameter(
            "File",
            docstring="Json File"
        ),
        "multiline": BooleanParameter(
            "Multi-line JSON file",
            default=False,
            docstring="Set multiline to True if the file contains multiple JSON objects, each on a separate line; otherwise, leave it as False for a single JSON object."
        ),
        "pollingTime": IntegerParameter(
            "Poll file every X seconds",
            default=0,
            docstring="If polling time set then the file will be polled every X seconds. If < 0, the flow will only run when file changes."
        ),
    }

    def execute(self, predecessor_data, flow_vars):
        print("*"*80)
        print("file")
        print(flow_vars["file"].get_value())
        try:
            # Read from file
            with open(flow_vars["file"].get_value(), 'r') as f:
                if flow_vars["multiline"].get_value():
                    # Process each line as a separate JSON object
                    json_objects = []
                    for line in f:
                        stripped_line = line.strip()
                        if stripped_line:  # Avoid empty lines
                            json_objects.append(json.loads(stripped_line))
                    
                    # Create a new JSON object that is an array of the JSON objects
                    json_string = json.dumps(json_objects)
                else:
                    # Read entire file as one JSON object
                    json_string = f.read()

                    # Check that it's valid JSON by converting it to an object and then back to string
                    json_string = json.dumps(json.loads(json_string))
            
            return json_string

        except Exception as e:
            print("got error in read")
            raise NodeException('read json', str(e))

