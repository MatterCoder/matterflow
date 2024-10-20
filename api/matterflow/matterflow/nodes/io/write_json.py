from matterflow.node import IONode, NodeException
from matterflow.parameters import *
import json
import jmespath

class WriteJsonNode(IONode):
    """WriteJsonNode

    Writes the current json to a Json file.

    Raises:
        NodeException: any error writing Json file, converting
            from json data.
    """
    name = "Write Json"
    num_in = 1
    num_out = 0
    download_result = False

    OPTIONS = {
        "file": StringParameter(
            "Filename",
            docstring="Json file to write"
        ),
        "write_mode": SelectParameter(
            "Write Mode",
            options=["overwrite", "append"],
            default="append",
            docstring="Overwrite or append to file"
        ),
        "exclude": StringParameter(
            "Exclude",
            default="",
            docstring="Exclude json matching this jmespath query"
        ),
    }

    def execute(self, predecessor_data, flow_vars):

        try:

            if flow_vars["exclude"].get_value() != '':
                print("trying to exclude now...................")
                filter_search_string = flow_vars["exclude"].get_value()

                search_results = jmespath.search(filter_search_string, predecessor_data[0])
                if search_results is not None: #if we found what we are looking for then exclude and dont write to disk
                    return '{"excluded":"true"}'

            # Convert JSON data to string
            json_string = json.dumps(predecessor_data[0])

            write_mode = 'a'
            if flow_vars["write_mode"].get_value() == 'overwrite':
                write_mode = 'w'

            # Write to CSV and save
            with open(flow_vars["file"].get_value(), write_mode) as f:
                f.write(json_string)
                f.write('\n')
                f.close()
    
            return json_string

        except Exception as e:
            raise NodeException('write json', str(e))
