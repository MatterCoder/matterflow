from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *

import pandas as pd
import json
import jmespath

class FilterNode(ManipulationNode):
    name = "Filter"
    num_in = 1
    num_out = 1

    OPTIONS = {
        "filter": StringParameter(
            "Filter",
            default='*',
            docstring="Jmespath query to filter"
        ),
        "include": BooleanParameter(
            "Include",
            default=True,
            docstring="Include entries found by filter"
        ),
        "data": BooleanParameter(
            "Output Filtered Data",
            default=False,
            docstring="Output filtered data instead of original data entry"
        ),
    }

    def execute(self, predecessor_data, flow_vars):
        # Convert JSON data to string
        try:
            json_string = json.dumps(predecessor_data[0])

            message = json.loads(json.dumps(predecessor_data[0]))
            filter_settings = flow_vars["filter"].get_value()
            include_settings = flow_vars["include"].get_value()
            data_settings = flow_vars["data"].get_value()

            #filter the input if required        
            filter = '*' #match everything but overwrite below if we have a filter
            if len(filter_settings)>0:
                filter = filter_settings

            input = '{"filtered":"true"}'
            transformedandfilterdata = jmespath.search(filter, message)
            if transformedandfilterdata is not None and transformedandfilterdata is not False:
                #we have found a match
                if include_settings: #check if we are to include
                    if data_settings: #check if data settings is true then we return the filtered
                        print("Filtering - sending back transformed data")
                        if type(transformedandfilterdata) is list and len(transformedandfilterdata)>0:
                            transformedandfilterdata[0]['filtered'] = "true"
                        input = json.dumps(transformedandfilterdata)
                    else:
                        print("Filtering - sending back original")
                        input = json.dumps(message)  
            else:
                if not include_settings:
                    input = json.dumps(message)
                else:
                    print("Filtering - ignoring message as the message does not given matching filter")

            return input

        except Exception as e:
            raise NodeException('filter', str(e))
