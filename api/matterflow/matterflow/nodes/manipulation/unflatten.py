from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *

import pandas as pd
import json
import jmespath
from collections import defaultdict


#######################

def transform_json_data(input_json):
    def nested_dict():
        return defaultdict(nested_dict)

    # Convert the defaultdict back to a regular dictionary
    def convert_to_regular_dict(d):
        if isinstance(d, defaultdict):
            d = {k: convert_to_regular_dict(v) for k, v in d.items()}
        return d

    def unflatten_attributes(data):
        if isinstance(data, dict):
            transformed_data = nested_dict()
            keys_to_remove = []
            for key, value in data.items():
                parts = key.split('/')
                if len(parts) == 3 and all(part.isdigit() for part in parts):
                    transformed_data[parts[0]][parts[1]][parts[2]] = value
                    keys_to_remove.append(key)
                else:
                    transformed_data[key] = value
            
            # Remove the original flat keys after adding the nested structure
            for key in keys_to_remove:
                del data[key]

            # Convert defaultdict back to regular dictionary
            return convert_to_regular_dict(transformed_data)
        elif isinstance(data, list):
            if len(data) == 3 and isinstance(data[1], str):
                parts = data[1].split('/')
                if len(parts) == 3 and all(part.isdigit() for part in parts):
                    transformed_data = nested_dict()
                    transformed_data[parts[0]][parts[1]][parts[2]] = data[2]
                    return [data[0], convert_to_regular_dict(transformed_data)]
            return [unflatten_attributes(item) if isinstance(item, (dict, list)) else item for item in data]
        else:
            return data

    def process_json(data):
        if isinstance(data, list):
            return [process_json(item) for item in data]
        elif isinstance(data, dict):
            if 'data' in data:
                #check if the attributes are nested
                if 'attributes' in data['data']:
                    data['data']['attributes'] = unflatten_attributes(data['data']['attributes'])
                else:
                    data['data'] = unflatten_attributes(data['data'])
            if 'result' in data:
                for result in data['result']:
                    if 'attributes' in result:
                        result['attributes'] = unflatten_attributes(result['attributes'])
            return data
        else:
            return data

    try:
        # Load the input JSON string into a Python object
        data = json.loads(input_json)

        # Process the JSON object
        processed_data = process_json(data)

        # Convert the Python object back to a JSON string
        return json.dumps(processed_data)

    except Exception as e:
        # Return the original JSON string in case of an exception
        return input_json
#######################


class UnflattenNode(ManipulationNode):
    name = "Unflatten"
    num_in = 1
    num_out = 1

    OPTIONS = {
    }

    def execute(self, predecessor_data, flow_vars):
            # Convert JSON data to string
        try:
            json_string = json.dumps(predecessor_data[0])

            json_string = transform_json_data(json_string)

            return json_string

        except Exception as e:
            raise NodeException('unflatten', str(e))
