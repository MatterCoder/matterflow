
/**
 * Sends request to server via fetch API and handles error cases
 * @param {string} endpoint - server endpoint
 * @param {Object} options - options parameter for `fetch` call
 * @returns {Promise<Object>} - server response or error
*/
function fetchWrapper(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
     fetch(endpoint, options)
         .then(async resp => {
             const data = await resp.json();
             //console.log(data);
             if (resp.ok) {
               return resolve(data);
             } else {
               return reject(data);
             }
         })
         .catch(err => {
             return reject(err);
         });
 });
}

/**
* Add connection to server-side workflow
* @param {ConnectionModel} node - connection to add
* @returns {Promise<Object>} - server response
*/
export async function addConnection(connection) {
  const payload = connection;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper("/connection/new", options);
}

/**
* Get available connections 
* @returns {Promise<Object>} - server response (connection items)
*/
export async function getConnections() {
  return fetchWrapper("/connection");
}

/**
* Update configuration of connection in server-side workflow
* @param {int} connection_id - connection_id to update
* @param {Object} config - configuration from options form
* @returns {Promise<Object>} - server response (serialized node)
*/
export async function updateConnection(connection_id, config) {
  const payload = config;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper(`/connection/${connection_id}`, options)
}

/**
 * Retrieve connection info from server side workflow
 * @param {string} connectionId - ID of node to retrieve
 * @returns {Promise<Object>} - server response (connection info)
 */
export async function getConnection(connectionId) {
  return fetchWrapper(`/connection/${connectionId}`);
}


/**
* Delete connection from server-side workflow
* @param {integer} connection_id - connection to remove
* @returns {Promise<Object>} - server response
*/
export async function deleteConnection(connection_id) {
  const options = {
      method: "DELETE"
  };
  return fetchWrapper(`/connection/${connection_id}`, options);
}


/**
* Get available processes 
* @returns {Promise<Object>} - server response (connection items)
*/
export async function getProcesses() {
  if (window.STORIES != undefined) {
  return {"data": "[{\"name\": \"2882b829-d663-436e-a6c5-eeb1255ca309\", \"group\": \"2882b829-d663-436e-a6c5-eeb1255ca309\", \"start\": 1727005637, \"stop\": 0, \"now\": 1727007080, \"state\": 20, \"statename\": \"RUNNING\", \"spawnerr\": \"\", \"exitstatus\": 0, \"logfile\": \"/tmp/2882b829-d663-436e-a6c5-eeb1255ca309-stdout---supervisor-4ewjcp45.log\", \"stdout_logfile\": \"/tmp/2882b829-d663-436e-a6c5-eeb1255ca309-stdout---supervisor-4ewjcp45.log\", \"stderr_logfile\": \"/tmp/2882b829-d663-436e-a6c5-eeb1255ca309-stderr---supervisor-rznur_qd.log\", \"pid\": 34624, \"description\": \"pid 34624, uptime 0:24:03\"}, {\"name\": \"foo\", \"group\": \"foo\", \"start\": 1727005637, \"stop\": 0, \"now\": 1727007080, \"state\": 20, \"statename\": \"RUNNING\", \"spawnerr\": \"\", \"exitstatus\": 0, \"logfile\": \"/tmp/foo-stdout---supervisor-q4nfbphz.log\", \"stdout_logfile\": \"/tmp/foo-stdout---supervisor-q4nfbphz.log\", \"stderr_logfile\": \"/tmp/foo-stderr---supervisor-f0wj18dq.log\", \"pid\": 34625, \"description\": \"pid 34625, uptime 0:24:03\"}]"};
  }
  return fetchWrapper("/process");
}

/**
* Add process to server-side workflow
* @param {FlowModel} node - flow to make a new process
* @returns {Promise<Object>} - server response
*/
export async function addProcess(flow) {
  const payload = flow;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper("/process/new", options);
}

/**
* Start process on server-side workflow
* @param {processName} name - processName
* @returns {Promise<Object>} - server response
*/
export async function startProcess(processName) {
  if (window.STORIES != undefined) {
    return {"result": true};
  }
  const payload = { processName: processName } //processName;
  const options = {
      method: "POST",
      body: JSON.stringify(payload), //this is the payload
  };
  return fetchWrapper("/process/start", options);
}

/**
* Stop process on server-side workflow
* @param {processName} name - processName
* @returns {Promise<Object>} - server response
*/
export async function stopProcess(processName) {
  if (window.STORIES != undefined) {
    return {"result": true};
  }
  const payload = { processName: processName } //processName;
  const options = {
      method: "POST",
      body: JSON.stringify(payload), //this is the payload
  };
  return fetchWrapper("/process/stop", options);
}

/**
* Delete process on server-side workflow
* @param {processName} name - processName
* @returns {Promise<Object>} - server response
*/
export async function deleteProcess(processName) {
  const payload = { processName: processName } //processName;
  const options = {
      method: "DELETE",
      body: JSON.stringify(payload), //this is the payload
  };
  return fetchWrapper("/process/delete", options);
}

/**
* Add flow to server-side workflow
* @param {FlowModel} node - flow to add
* @returns {Promise<Object>} - server response
*/
export async function addFlow(flow) {
  if (window.STORIES != undefined) {
    return {"Message": "Flow Created", "Id": 210, "Request Body": "{\"name\": \"bbfb4758-48d8-4b70-9306-bf10e65ff860\", \"description\": \"flow-rwftq4\", \"json_data\": \"{\\\"id\\\":\\\"bbfb4758-48d8-4b70-9306-bf10e65ff860\\\",\\\"offsetX\\\":0,\\\"offsetY\\\":0,\\\"zoom\\\":100,\\\"gridSize\\\":0,\\\"layers\\\":[{\\\"id\\\":\\\"7858af38-452e-49ea-99a8-4af3e31c66d9\\\",\\\"type\\\":\\\"diagram-links\\\",\\\"isSvg\\\":true,\\\"transformed\\\":true,\\\"models\\\":{}},{\\\"id\\\":\\\"504eba09-2c8b-43d3-88c2-62a80a196445\\\",\\\"type\\\":\\\"diagram-nodes\\\",\\\"isSvg\\\":false,\\\"transformed\\\":true,\\\"models\\\":{}}]}\"}"};
  }
  const payload = flow;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper("/flow/new", options);
}

/**
* Get available flows 
* @returns {Promise<Object>} - server response (flow items)
*/
export async function getFlows() {
  if (window.STORIES != undefined) {
    return {"data": [{"id": 206, "name": "2882b829-d663-436e-a6c5-eeb1255ca309", "description": "flow-x3170j", "json_data": "{\"id\":\"2882b829-d663-436e-a6c5-eeb1255ca309\",\"offsetX\":0,\"offsetY\":0,\"zoom\":100,\"gridSize\":0,\"layers\":[{\"id\":\"9ead6483-6509-4aa0-87db-714b15e3ae9c\",\"type\":\"diagram-links\",\"isSvg\":true,\"transformed\":true,\"models\":{}},{\"id\":\"caeec8ce-327d-4cd4-8078-1024e78544af\",\"type\":\"diagram-nodes\",\"isSvg\":false,\"transformed\":true,\"models\":{\"b5464292-f9d9-42b7-b995-8e1bfe3ceab3\":{\"id\":\"b5464292-f9d9-42b7-b995-8e1bfe3ceab3\",\"type\":\"custom-node\",\"x\":335.5,\"y\":284,\"ports\":[{\"id\":\"d4022bcf-624f-4d87-ab59-1e6b799b3001\",\"type\":\"mf-port\",\"x\":347.51666259765625,\"y\":308,\"name\":\"flow-in\",\"alignment\":\"left\",\"parentNode\":\"b5464292-f9d9-42b7-b995-8e1bfe3ceab3\",\"links\":[],\"in\":true,\"label\":\"flow-in\"},{\"id\":\"6e0696e5-9570-4598-8d79-08577d9c9b4b\",\"type\":\"mf-port\",\"x\":429.51666259765625,\"y\":325,\"name\":\"out-0\",\"alignment\":\"right\",\"parentNode\":\"b5464292-f9d9-42b7-b995-8e1bfe3ceab3\",\"links\":[],\"in\":false,\"label\":\"out-0\"}],\"options\":{\"id\":\"b5464292-f9d9-42b7-b995-8e1bfe3ceab3\",\"name\":\"WS Connection\",\"node_key\":\"WsConnectionNode\",\"node_type\":\"connection\",\"num_in\":0,\"num_out\":1,\"color\":\"blue\",\"filename\":\"ws_connection\",\"doc\":\"WsConnectionNode\\n\\n    Reads a Websocket into a workflow.\\n\\n    Raises:\\n         NodeException: any error reading web socket, converting\\n            to workflow.\\n    \",\"option_types\":{\"file\":{\"type\":\"file\",\"label\":\"Test Json\",\"value\":\"\",\"docstring\":\"Json File\"}},\"download_result\":false,\"type\":\"custom-node\",\"node_id\":\"b5464292-f9d9-42b7-b995-8e1bfe3ceab3\",\"status\":\"unconfigured\"},\"config\":{\"file\":\"\"}}}}]}"}]};
  }
  return fetchWrapper("/flow");
}

/**
* Update configuration of flow in server-side workflow
* @param {int} flow_id - flow_id to update
* @param {Object} config - configuration from options form
* @returns {Promise<Object>} - server response (serialized node)
*/
export async function updateFlow(flow_id, config) {
  if (window.STORIES != undefined) {
    return {"message": "POST successful"};  
  }
  const payload = config;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper(`/flow/${flow_id}`, options)
}

/**
 * Retrieve flow info from server side workflow
 * @param {string} flowId - ID of node to retrieve
 * @returns {Promise<Object>} - server response (flow info)
 */
export async function getFlow(flowId) {
  if (window.STORIES != undefined) {
    return {"data": {"id": "207", "name": "720c2cc1-574d-4edd-8cb2-0efdadf3faaa", "description": "flow-al7tjf", "json_data": "{\"id\":\"720c2cc1-574d-4edd-8cb2-0efdadf3faaa\",\"offsetX\":0,\"offsetY\":0,\"zoom\":100,\"gridSize\":0,\"layers\":[{\"id\":\"51a13f2b-1770-4a15-ac9a-d627cb1ef547\",\"type\":\"diagram-links\",\"isSvg\":true,\"transformed\":true,\"models\":{}},{\"id\":\"2f408b04-5590-45ff-8f2c-46c2d3fa47d1\",\"type\":\"diagram-nodes\",\"isSvg\":false,\"transformed\":true,\"models\":{}}]}"}};
  }
  return fetchWrapper(`/flow/${flowId}`);
}


/**
* Delete flow from server-side workflow
* @param {integer} flow_id - flow to remove
* @returns {Promise<Object>} - server response
*/
export async function deleteFlow(flow_id) {
  if (window.STORIES != undefined) {
    return {"Message": "DELETE successful", "Request Body": {"data": "true"}};
  }
  const options = {
      method: "DELETE"
  };
  return fetchWrapper(`/flow/${flow_id}`, options);
}

/**
* Get available models 
* @returns {Promise<Object>} - server response (connection items)
*/
export async function getModels() {
  if (window.STORIES != undefined) {
    return {"data": [{"id": 7, "name": "model name", "description": "model1", "json_data": "[{'fieldName': 'ts', 'fieldDatatype': 'Timestamp', 'fieldNameError': ''}, {'fieldName': 'nodeId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'endpointId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'clusterId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'attributeId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'value', 'fieldDatatype': 'Object', 'fieldNameError': ''}, {'fieldName': 'vendorName', 'fieldDatatype': 'String', 'fieldNameError': ''}, {'fieldName': 'productName', 'fieldDatatype': 'String', 'fieldNameError': ''}]"}, {"id": 11, "name": "newModel8.json", "description": "model2", "json_data": "[{'fieldName': 'test', 'fieldDatatype': 'String', 'fieldNameError': ''}]"}]}
  }
  return fetchWrapper("/model");
}

/**
* Add model to server-side workflow
* @param {FlowModel} node - flow to make a new model
* @returns {Promise<Object>} - server response
*/
export async function addModel(flow) {
  if (window.STORIES != undefined) {
    return {"Message": "Model Created", "Request Body": "{\"id\": 13, \"description\": \"unique13\", \"name\": \"newModel13.json\", \"json_data\": {}}"};
  }
  const payload = flow;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper("/model/new", options);
}

/**
* Update configuration of model in server-side workflow
* @param {int} model_id - model_id to update
* @param {Object} config - configuration from options form
* @returns {Promise<Object>} - server response (serialized node)
*/
export async function updateModel(model_id, config) {
  if (window.STORIES != undefined) {
    return {"message": "POST successful"};
  }
  const payload = config;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper(`/model/${model_id}`, options)
}

/**
 * Retrieve model info from server side workflow
 * @param {string} modelId - ID of node to retrieve
 * @returns {Promise<Object>} - server response (model info)
 */
export async function getModel(modelId) {
  if (window.STORIES != undefined) {
    return {"data": {"id": "7", "name": "model name", "description": "model1", "json_data": "[{'fieldName': 'ts', 'fieldDatatype': 'Timestamp', 'fieldNameError': ''}, {'fieldName': 'nodeId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'endpointId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'clusterId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'attributeId', 'fieldDatatype': 'Number', 'fieldNameError': ''}, {'fieldName': 'value', 'fieldDatatype': 'Object', 'fieldNameError': ''}, {'fieldName': 'vendorName', 'fieldDatatype': 'String', 'fieldNameError': ''}, {'fieldName': 'productName', 'fieldDatatype': 'String', 'fieldNameError': ''}]"}};
  }
  return fetchWrapper(`/model/${modelId}`);
}


/**
* Delete model from server-side workflow
* @param {integer} model_id - model to remove
* @returns {Promise<Object>} - server response
*/
export async function deleteModel(model_id) {
  if (window.STORIES != undefined) {
    return {"message": "DELETE successful"};
  }
  const options = {
      method: "DELETE"
  };
  return fetchWrapper(`/model/${model_id}`, options);
}

/**
* Get available instances 
* @returns {Promise<Object>} - server response (connection items)
*/
export async function getInstances() {
  if (window.STORIES != undefined) {
    return {"data": [{"id": 6, "name": "instance - 14/9/2024, 12:44:25", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"ts\",\"fieldDatatype\":\"Timestamp\",\"fieldValue\":\"\"},{\"fieldName\":\"nodeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[0]\"},{\"fieldName\":\"endpointId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1]|keys(@)|[0]\"},{\"fieldName\":\"clusterId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1].\\\"{endpointId}\\\"|keys(@)|[0]\"},{\"fieldName\":\"attributeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1].\\\"{endpointId}\\\".\\\"{clusterId}\\\"|keys(@)|[0]\"},{\"fieldName\":\"value\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1].\\\"{endpointId}\\\".\\\"{clusterId}\\\".\\\"{attributeId}\\\"\"},{\"fieldName\":\"vendorName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"[?node_id == `{nodeId}`].attributes.\\\"0\\\".\\\"40\\\".\\\"1\\\"|[0]\"},{\"fieldName\":\"productName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"[?node_id == `{nodeId}`].attributes.\\\"0\\\".\\\"40\\\".\\\"3\\\"|[0]\"}]"}, {"id": 7, "name": "instance - 14/9/2024, 14:36:00", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"ts\",\"fieldDatatype\":\"Timestamp\",\"fieldValue\":\"\"},{\"fieldName\":\"nodeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"endpointId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"clusterId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"attributeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"value\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"\"},{\"fieldName\":\"vendorName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"\"},{\"fieldName\":\"productName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"asas\"}]"}, {"id": 9, "name": "instance - 14/9/2024, 14:30:35", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"test\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"\"}]"}]};
  }
  return fetchWrapper("/instance");
}

/**
* Add instance to server-side workflow
* @param {FlowModel} node - flow to make a new instance
* @returns {Promise<Object>} - server response
*/
export async function addInstance(flow) {
  if (window.STORIES != undefined) {
    return {"data": [{"id": 6, "name": "instance - 14/9/2024, 12:44:25", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"ts\",\"fieldDatatype\":\"Timestamp\",\"fieldValue\":\"\"},{\"fieldName\":\"nodeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[0]\"},{\"fieldName\":\"endpointId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1]|keys(@)|[0]\"},{\"fieldName\":\"clusterId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1].\\\"{endpointId}\\\"|keys(@)|[0]\"},{\"fieldName\":\"attributeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1].\\\"{endpointId}\\\".\\\"{clusterId}\\\"|keys(@)|[0]\"},{\"fieldName\":\"value\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"[?event == `attribute_updated`].data|[0]|[1].\\\"{endpointId}\\\".\\\"{clusterId}\\\".\\\"{attributeId}\\\"\"},{\"fieldName\":\"vendorName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"[?node_id == `{nodeId}`].attributes.\\\"0\\\".\\\"40\\\".\\\"1\\\"|[0]\"},{\"fieldName\":\"productName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"[?node_id == `{nodeId}`].attributes.\\\"0\\\".\\\"40\\\".\\\"3\\\"|[0]\"}]"}, {"id": 7, "name": "instance - 14/9/2024, 14:36:00", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"ts\",\"fieldDatatype\":\"Timestamp\",\"fieldValue\":\"\"},{\"fieldName\":\"nodeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"endpointId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"clusterId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"attributeId\",\"fieldDatatype\":\"Number\",\"fieldValue\":\"\"},{\"fieldName\":\"value\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"\"},{\"fieldName\":\"vendorName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"\"},{\"fieldName\":\"productName\",\"fieldDatatype\":\"String\",\"fieldValue\":\"asas\"}]"}, {"id": 9, "name": "instance - 14/9/2024, 14:30:35", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"test\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"\"}]"}, {"id": 10, "name": "newInstance10.json", "description": "unique10", "json_data": "{}"}, {"id": 11, "name": "newInstance11.json", "description": "unique11", "json_data": "{}"}]};
  }
  const payload = flow;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper("/instance/new", options);
}

/**
* Update configuration of instance in server-side workflow
* @param {int} instance_id - instance_id to update
* @param {Object} config - configuration from options form
* @returns {Promise<Object>} - server response (serialized node)
*/
export async function updateInstance(instance_id, config) {
  if (window.STORIES != undefined) {
    return {"message": "POST successful"};
  }
  const payload = config;
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper(`/instance/${instance_id}`, options)
}

/**
 * Retrieve instance info from server side workflow
 * @param {string} instanceId - ID of node to retrieve
 * @returns {Promise<Object>} - server response (instance info)
 */
export async function getInstance(instanceId) {
  if (window.STORIES != undefined) {
    return {"data": {"id": "9", "name": "instance - 14/9/2024, 14:30:35", "description": "instance descriptipn", "json_data": "[{\"fieldName\":\"test\",\"fieldDatatype\":\"Object\",\"fieldValue\":\"\"}]"}};
  }
  return fetchWrapper(`/instance/${instanceId}`);
}


/**
* Delete instance from server-side workflow
* @param {integer} instance_id - instance to remove
* @returns {Promise<Object>} - server response
*/
export async function deleteInstance(instance_id) {
  if (window.STORIES != undefined) {
    return {"message": "DELETE successful"};
  }
  const options = {
      method: "DELETE"
  };
  return fetchWrapper(`/instance/${instance_id}`, options);
}


/**
 * Offer data as a file download from the browser
 * @param {string} data - data to download
 * @param {string} contentType - MIME type
 * @param {string} fileName - name of downloaded file
 */
export function downloadFile(data, contentType, fileName) {
  const blob = new Blob([data], {type: contentType})
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "download";
  anchor.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Retrieve system info from server side 
 * @returns {Promise<Object>} - server response (system info)
 */
export async function getInfo() {
  return fetchWrapper(`/info`);
}


/**
 * Retrieve node info from server side workflow
 * @param {string} nodeId - ID of node to retrieve
 * @returns {Promise<Object>} - server response (node info and flow variables)
 */
export async function getNode(nodeId) {
  return fetchWrapper(`/node/${nodeId}`);
}


/**
* Add node to server-side workflow
* @param {CustomNodeModel} node - JS node to add
* @returns {Promise<Object>} - server response
*/
export async function addNode(node) {
  if (window.STORIES != undefined) {
  return {"message": "Added new node to graph with id: 75a02755-a379-4d0b-861d-8534f1843ce0"};
  }
  const payload = {...node.options, options: node.config};
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  return fetchWrapper("/node/", options);
}


/**
* Delete node from server-side workflow
* @param {CustomNodeModel} node - JS node to remove
* @returns {Promise<Object>} - server response
*/
export async function deleteNode(node) {
  if (window.STORIES != undefined) {
    return {"message": "Removed node ID #892b8e23-38eb-477a-a01d-d3aa3d1852ee"};
  }
  const id = node.options.id;
  const options = {
      method: "DELETE"
  };
  const endpoint = node.options.is_global ? "node/global" : "node";
  return fetchWrapper(`/${endpoint}/${id}`, options);
}


/**
* Update configuration of node in server-side workflow
* @param {CustomNodeModel} node - JS node to remove
* @param {Object} config - configuration from options form
* @param {Object} flowConfig - flow variable configuration options
* @returns {Promise<Object>} - server response (serialized node)
*/
export async function updateNode(node, config, flowConfig) {
  node.config = config;
  node.options.option_replace = flowConfig;
  const payload = {...node.options, options: node.config};
  const options = {
      method: "POST",
      body: JSON.stringify(payload)
  };
  const endpoint = node.options.is_global ? "node/global" : "node";
  return fetchWrapper(`/${endpoint}/${node.options.id}`, options)
}


/**
* Save front-end workflow and download server response as JSON file
* @param {Object} diagramData - serialized react-diagrams model
*/
export async function save(diagramData, download=true, scrubSensitiveData = false) {
  const payload = JSON.stringify(diagramData);
  const options = {
      method: "POST",
      body: payload
  };
  fetchWrapper("/workflow/save", options)
      .then(json => {
          if (scrubSensitiveData) {
            json = filterSensitiveData(json);  // Scrub sensitive data if flag is true
          }
          if (download){downloadFile(JSON.stringify(json), "application/json", json.filename || "diagram.json")}
      }).catch(err => console.log(err));
}

/**
* Save front-end workflow to server as JSON file
* @param {Object} diagramData - serialized react-diagrams model
*/
export async function saveToServer(diagramData) {
  if (window.STORIES != undefined) {
    return {"filename": "720c2cc1-574d-4edd-8cb2-0efdadf3faaa.json", "react": {"id": "720c2cc1-574d-4edd-8cb2-0efdadf3faaa", "offsetX": 0, "offsetY": 0, "zoom": 100, "gridSize": 0, "layers": [{"id": "51a13f2b-1770-4a15-ac9a-d627cb1ef547", "type": "diagram-links", "isSvg": true, "transformed": true, "models": {}}, {"id": "2f408b04-5590-45ff-8f2c-46c2d3fa47d1", "type": "diagram-nodes", "isSvg": false, "transformed": true, "models": {"d054a431-236d-4940-8055-5f251f4c4851": {"id": "d054a431-236d-4940-8055-5f251f4c4851", "type": "custom-node", "x": 270.5, "y": 228, "ports": [{"id": "0fb72967-2cd9-406b-a48f-bfb38c254edf", "type": "mf-port", "x": 282.51666259765625, "y": 252, "name": "flow-in", "alignment": "left", "parentNode": "d054a431-236d-4940-8055-5f251f4c4851", "links": [], "in": true, "label": "flow-in"}, {"id": "35a5e72b-53a7-470e-a676-c2c4537b1b65", "type": "mf-port", "x": 364.51666259765625, "y": 269, "name": "out-0", "alignment": "right", "parentNode": "d054a431-236d-4940-8055-5f251f4c4851", "links": [], "in": false, "label": "out-0"}], "options": {"id": "d054a431-236d-4940-8055-5f251f4c4851", "name": "WS Connection", "node_key": "WsConnectionNode", "node_type": "connection", "num_in": 0, "num_out": 1, "color": "blue", "filename": "ws_connection", "doc": "WsConnectionNode\n\n    Reads a Websocket into a workflow.\n\n    Raises:\n         NodeException: any error reading web socket, converting\n            to workflow.\n    ", "option_types": {"file": {"type": "file", "label": "Test Json", "value": "", "docstring": "Json File"}}, "download_result": false, "type": "custom-node", "node_id": "d054a431-236d-4940-8055-5f251f4c4851", "status": "unconfigured"}, "config": {"file": ""}}}}]}, "matterflow": {"name": "720c2cc1-574d-4edd-8cb2-0efdadf3faaa", "root_dir": "/tmp", "graph": {"directed": true, "multigraph": false, "graph": {}, "nodes": [{"name": "WS Connection", "node_id": "d054a431-236d-4940-8055-5f251f4c4851", "node_type": "connection", "node_key": "WsConnectionNode", "data": null, "filename": "ws_connection", "is_global": false, "options": {"file": ""}, "option_replace": {}, "id": "d054a431-236d-4940-8055-5f251f4c4851"}], "links": []}, "flow_vars": {"directed": false, "multigraph": false, "graph": {}, "nodes": [], "links": []}}};
  }
  const payload = JSON.stringify(diagramData);
  const options = {
      method: "POST",
      body: payload
  };
  return fetchWrapper("/workflow/savetoserver", options)
}

/**
* Get available nodes for node menu
* @returns {Promise<Object>} - server response (node menu items)
*/
export async function getNodes() {
  if (window.STORIES != undefined) {
    return {"Manipulation": [{"name": "Pivoting", "node_key": "PivotNode", "node_type": "manipulation", "num_in": 1, "num_out": 3, "color": "goldenrod", "filename": "pivot", "doc": null, "options": {"index": null, "values": null, "columns": null, "aggfunc": "mean", "fill_value": null, "margins": false, "dropna": true, "margins_name": "All", "observed": false}, "option_types": {"index": {"type": "string", "label": "Index", "value": null, "docstring": "Column to aggregate (column, grouper, array or list)"}, "values": {"type": "string", "label": "Values", "value": null, "docstring": "Column name to use to populate new frame's values (column, grouper, array or list)"}, "columns": {"type": "string", "label": "Column Name Row", "value": null, "docstring": "Column(s) to use for populating new frame values. (column, grouper, array or list)"}, "aggfunc": {"type": "string", "label": "Aggregation function", "value": "mean", "docstring": "Function used for aggregation (function, list of functions, dict, default numpy.mean)"}, "fill_value": {"type": "string", "label": "Fill value", "value": null, "docstring": "Value to replace missing values with (scalar)"}, "margins": {"type": "boolean", "label": "Margins name", "value": false, "docstring": "Add all rows/columns"}, "dropna": {"type": "boolean", "label": "Drop NaN columns", "value": true, "docstring": "Ignore columns with all NaN entries"}, "margins_name": {"type": "string", "label": "Margins name", "value": "All", "docstring": "Name of the row/column that will contain the totals when margins is True"}, "observed": {"type": "boolean", "label": "Column Name Row", "value": false, "docstring": "Row number with column names (0-indexed) or \"infer\""}}, "download_result": false}, {"name": "Mapping", "node_key": "MappingNode", "node_type": "manipulation", "num_in": 1, "num_out": 1, "color": "goldenrod", "filename": "mapping", "doc": null, "options": {"modelmapping": null}, "option_types": {"modelmapping": {"type": "instanceselect", "label": "ModelMapping", "value": null, "docstring": null, "options": []}}, "download_result": false}, {"name": "Joiner", "node_key": "JoinNode", "node_type": "manipulation", "num_in": 2, "num_out": 1, "color": "goldenrod", "filename": "join", "doc": null, "options": {"on": null}, "option_types": {"on": {"type": "string", "label": "Join Column", "value": null, "docstring": "Name of column to join on"}}, "download_result": false}, {"name": "Combiner", "node_key": "CombineNode", "node_type": "manipulation", "num_in": 2, "num_out": 1, "color": "goldenrod", "filename": "combine", "doc": null, "options": {}, "option_types": {}, "download_result": false}, {"name": "Unflatten", "node_key": "UnflattenNode", "node_type": "manipulation", "num_in": 1, "num_out": 1, "color": "goldenrod", "filename": "unflatten", "doc": null, "options": {}, "option_types": {}, "download_result": false}, {"name": "Filter", "node_key": "FilterNode", "node_type": "manipulation", "num_in": 1, "num_out": 1, "color": "goldenrod", "filename": "filter", "doc": null, "options": {"filter": "*", "include": true, "data": false}, "option_types": {"filter": {"type": "string", "label": "Filter", "value": "*", "docstring": "Jmespath query to filter"}, "include": {"type": "boolean", "label": "Include", "value": true, "docstring": "Include entries found by filter"}, "data": {"type": "boolean", "label": "Output Filtered Data", "value": false, "docstring": "Output filtered data instead of original data entry"}}, "download_result": false}], "Visualization": [{"name": "Graph Node", "node_key": "GraphNode", "node_type": "visualization", "num_in": 1, "num_out": 0, "color": "red", "filename": "graph", "doc": "Displays a pandas DataFrame in a visual graph.\n\n    Raises:\n        NodeException: any error generating Altair Chart.\n    ", "options": {"graph_type": "bar", "mark_options": false, "width": 10, "height": 10, "encode_options": true, "x_axis": "a", "y_axis": "average(b)"}, "option_types": {"graph_type": {"type": "select", "label": "Graph Type", "value": "bar", "docstring": "Graph viz type", "options": ["area", "bar", "line", "point"]}, "mark_options": {"type": "boolean", "label": "Specify mark options", "value": false, "docstring": "Specify mark options"}, "width": {"type": "int", "label": "Mark width", "value": 10, "docstring": "Width of marks"}, "height": {"type": "int", "label": "Mark height", "value": 10, "docstring": "Height of marks"}, "encode_options": {"type": "boolean", "label": "Specify encoding options", "value": true, "docstring": "Specify encoding options"}, "x_axis": {"type": "string", "label": "X-Axis", "value": "a", "docstring": "X-axis values"}, "y_axis": {"type": "string", "label": "Y-Axis", "value": "average(b)", "docstring": "Y-axis values"}}, "download_result": false}], "Connection": [{"name": "WS Connection", "node_key": "WsConnectionNode", "node_type": "connection", "num_in": 0, "num_out": 1, "color": "blue", "filename": "ws_connection", "doc": "WsConnectionNode\n\n    Reads a Websocket into a workflow.\n\n    Raises:\n         NodeException: any error reading web socket, converting\n            to workflow.\n    ", "options": {"file": ""}, "option_types": {"file": {"type": "file", "label": "Test Json", "value": "", "docstring": "Json File"}}, "download_result": false}], "  Pycache  ": [], "I/O": [{"name": "Table Creator", "node_key": "TableCreatorNode", "node_type": "io", "num_in": 0, "num_out": 1, "color": "green", "filename": "table_creator", "doc": "Accepts raw-text CSV input to create data tables.\n\n    Raises:\n         NodeException: any error reading CSV file, converting\n            to DataFrame.\n    ", "options": {"input": "", "sep": ",", "header": "infer"}, "option_types": {"input": {"type": "text", "label": "Input", "value": "", "docstring": "Text input"}, "sep": {"type": "string", "label": "Delimiter", "value": ",", "docstring": "Column delimiter"}, "header": {"type": "string", "label": "Header Row", "value": "infer", "docstring": "Row number containing column names (0-indexed)"}}, "download_result": false}, {"name": "Write Json", "node_key": "WriteJsonNode", "node_type": "io", "num_in": 1, "num_out": 0, "color": "green", "filename": "write_json", "doc": "WriteJsonNode\n\n    Writes the current json to a Json file.\n\n    Raises:\n        NodeException: any error writing Json file, converting\n            from json data.\n    ", "options": {"file": null, "write_mode": "append", "exclude": ""}, "option_types": {"file": {"type": "string", "label": "Filename", "value": null, "docstring": "CSV file to write"}, "write_mode": {"type": "select", "label": "Write Mode", "value": "append", "docstring": "Overwrite or append to file", "options": ["overwrite", "append"]}, "exclude": {"type": "string", "label": "Exclude", "value": "", "docstring": "Exclude json matching this jmespath query"}}, "download_result": true}, {"name": "Write CSV", "node_key": "WriteCsvNode", "node_type": "io", "num_in": 1, "num_out": 0, "color": "green", "filename": "write_csv", "doc": "WriteCsvNode\n\n    Writes the current DataFrame to a CSV file.\n\n    Raises:\n        NodeException: any error writing CSV file, converting\n            from DataFrame.\n    ", "options": {"file": null, "sep": ",", "index": true}, "option_types": {"file": {"type": "string", "label": "Filename", "value": null, "docstring": "CSV file to write"}, "sep": {"type": "string", "label": "Delimiter", "value": ",", "docstring": "Column delimiter"}, "index": {"type": "boolean", "label": "Write Index", "value": true, "docstring": "Write index as column?"}}, "download_result": true}, {"name": "Read Json", "node_key": "ReadJsonNode", "node_type": "io", "num_in": 0, "num_out": 1, "color": "green", "filename": "read_json", "doc": "ReadJsonNode\n\n    Reads a Json file into a workflow.\n\n    Raises:\n         NodeException: any error reading json file, converting\n            to workflow.\n    ", "options": {"file": null}, "option_types": {"file": {"type": "file", "label": "File", "value": null, "docstring": "Json File"}}, "download_result": false}, {"name": "Read CSV", "node_key": "ReadCsvNode", "node_type": "io", "num_in": 0, "num_out": 1, "color": "green", "filename": "read_csv", "doc": "ReadCsvNode\n\n    Reads a CSV file into a pandas DataFrame.\n\n    Raises:\n         NodeException: any error reading CSV file, converting\n            to DataFrame.\n    ", "options": {"file": null, "sep": ",", "header": "infer"}, "option_types": {"file": {"type": "file", "label": "File", "value": null, "docstring": "CSV File"}, "sep": {"type": "string", "label": "Delimiter", "value": ",", "docstring": "Column delimiter"}, "header": {"type": "string", "label": "Header Row", "value": "infer", "docstring": "Row number containing column names (0-indexed)"}}, "download_result": false}], "Flow Control": [{"name": "String Input", "node_key": "StringNode", "node_type": "flow_control", "num_in": 0, "num_out": 0, "color": "purple", "filename": "string_input", "doc": "StringNode object\n\n    Allows for Strings to replace 'string' fields in Nodes\n    ", "options": {"default_value": null, "var_name": "my_var"}, "option_types": {"default_value": {"type": "string", "label": "Default Value", "value": null, "docstring": "Value this node will pass as a flow variable"}, "var_name": {"type": "string", "label": "Variable Name", "value": "my_var", "docstring": "Name of the variable to use in another Node"}}, "download_result": false}, {"name": "Integer Input", "node_key": "IntegerNode", "node_type": "flow_control", "num_in": 0, "num_out": 0, "color": "purple", "filename": "integer_input", "doc": "StringNode object\n\n    Allows for Strings to replace 'string' fields in Nodes\n    ", "options": {"default_value": null, "var_name": "my_var"}, "option_types": {"default_value": {"type": "int", "label": "Default Value", "value": null, "docstring": "Value this node will pass as a flow variable"}, "var_name": {"type": "string", "label": "Variable Name", "value": "my_var", "docstring": "Name of the variable to use in another Node"}}, "download_result": false}], "Custom Nodes": []}
  }    
  return fetchWrapper("/workflow/nodes");
}


/**
* Get global flow variables for workflow
* @returns {Promise<Object>} - server response (global flow variables)
*/
export async function getGlobalVars() {
  if (window.STORIES != undefined) {
  return [];
  }
  return fetchWrapper("/workflow/globals");
}


/**
* Start a new workflow on the server
* @param {DiagramModel} model - Diagram model
* @returns {Promise<Object>} - server response
*/
export async function initWorkflow(model) {
  if (window.STORIES != undefined) {
    return {"directed": true, "multigraph": false, "graph": {}, "nodes": [], "links": []};
  }
  const options = {
      method: "POST",
      body: JSON.stringify({
          "id": model.options.id
      })
  };

  return fetchWrapper("/workflow/new", options);
}


/**
* Activates JSON workflow file on server
* @param {Object} jsonData - json data
* @returns {Promise<Object>} - server response (full serialized workflow)
*/
export async function activateWorkflow(jsonData) {
  const options = {
      method: "POST",
      body: JSON.stringify(jsonData)
  };
  return fetchWrapper("/workflow/activate", options);
}

/**
* Uploads JSON workflow file to server
* @param {FormData} formData - form with key `file` and value of type `File`
* @returns {Promise<Object>} - server response (full serialized workflow)
*/
export async function uploadWorkflow(formData) {
  const options = {
      method: "POST",
      body: formData
  };
  return fetchWrapper("/workflow/open", options);
}


async function handleEdge(link, method) {
  const sourceId = link.getSourcePort().getNode().options.id;
  const targetId = link.getTargetPort().getNode().options.id;

  let endpoint;

  if (link.getSourcePort().options.in) {
      // If edge goes from IN port -> OUT port, reverse the ports
      endpoint = `/node/edge/${targetId}/${sourceId}`;
  } else {
      // Otherwise, keep source -> target edge
      endpoint = `/node/edge/${sourceId}/${targetId}`;
  }

  return fetchWrapper(endpoint, {method: method});
}


/**
* Add edge to server-side workflow
* @param {MFLinkModel} link - JS edge to create
* @returns {Promise<Object>} - server response
*/
export async function addEdge(link) {
  if (window.STORIES != undefined) {
   return {"edge_added": ["f44be0d5-d26a-4ee7-b9a4-6bdadf428edb", "946accee-d4ad-413b-a429-e3e407c815c7"]}  
  }
  return handleEdge(link, "POST");
}


/**
* Delete edge from server-side workflow
* @param {MFLinkModel} link - JS edge to delete
* @returns {Promise<Object>} - server response
*/
export async function deleteEdge(link) {
  if (window.STORIES != undefined) {
    return {"edge_deleted": ["f44be0d5-d26a-4ee7-b9a4-6bdadf428edb", "946accee-d4ad-413b-a429-e3e407c815c7"]}  
   }
   return handleEdge(link, "DELETE");
}


/**
* Upload a data file to be stored on the server
* @param {FormData} formData - FormData with file and nodeId
* @returns {Promise<Object>} - server response
*/
export async function uploadDataFile(formData) {
  const options = {
      method: "POST",
      body: formData
  };
  return fetchWrapper("/workflow/upload", options);
}


/**
* Download file by name from server
* @param {CustomNodeModel} node - node containing file to download
* @returns {Promise<void>}
*/
export async function downloadDataFile(node) {
  // TODO: make this not a giant security problem
  let contentType;

  const payload = {...node.options, options: node.config};

  // can't use fetchWrapper because it assumes JSON response
  fetch(`/workflow/download`, {
      method: "POST",
      body: JSON.stringify(payload)
  })
      .then(async resp => {
          if (!resp.ok) return Promise.reject(await resp.json());
          contentType = resp.headers.get("content-type");
          let filename = resp.headers.get("Content-Disposition");

          if (contentType.startsWith("text") || contentType === "application/json") {
              resp.text().then(data => {
                  downloadFile(data, contentType, filename);
              })
          }
      }).catch(err => console.log(err));
}


/**
* Get execution order of nodes in graph
* @returns {Promise<Object>} - server response (array of node IDs)
*/
export async function executionOrder() {
  return fetchWrapper("/workflow/execute");
}

/**
* Execute given node on server
* @param {CustomNodeModel }node - node to execute
* @returns {Promise<Object>} - server response
*/
export async function execute(node) {
  if (window.STORIES != undefined) {
    return ["650086cd-8f30-4ab7-b1d6-64ded6ceeaad"];
  }
  const id = node.options.id;
  return fetchWrapper(`/node/${id}/execute`);
}

/**
* Retrieves the data at the state of the specified node
* @param {string }nodeId - node identifier for an execution state
* @returns {Promise<Object>} - json respnse with the data at specified state
*/
export async function retrieveData(nodeId) {
  if (window.STORIES != undefined) {
    return {"data": "data"}
  }
  return fetchWrapper(`/node/${nodeId}/retrieve_data`);
}

/**
* Retrieves the data by the specified file
* @param {string }nodeId - node identifier for an execution state
* @param {string }file - file identifier for a node
* @returns {Promise<Object>} - json respnse with the data at specified state
*/
export async function retrieveDataByFile(nodeId, file) {
  if (window.STORIES != undefined) {
    return {"data": "data"}
  }
  return fetchWrapper(`/node/${nodeId}/retrieve_data_by_file/${file}`);
}

function filterSensitiveData(data) {
  const processedData = JSON.parse(JSON.stringify(data)); // Deep copy to avoid mutating original

  // Define patterns for sensitive `var_name` values
  const sensitiveVarPatterns = [
    /aws.*key/i,
    /azure.*key/i,
    /google.*key/i,
    /gcp.*key/i,
    /db.*host/i,
    /db.*password/i,
    /db.*user/i,
    /database.*password/i,
    /database.*user/i,
    /api.*key/i,
    /api.*secret/i,
    /token/i,
    /secret/i,
    /private.*key/i,
    /public.*key/i,
    /jwt/i,
    /encryption.*key/i,
    /mail.*key/i,
    /stripe.*key/i,
    /paypal.*secret/i,
    /facebook.*id/i,
    /facebook.*secret/i,
    /twitter.*key/i,
    /linkedin.*id/i,
    /linkedin.*secret/i,
    /password/i,
    /auth/i,
    /session/i,
    /credential/i
  ];

  // Check and redact sensitive `default_value` if `var_name` is sensitive
  function redactSensitiveDefaultValue(nodes) {
      nodes.forEach(node => {
          if (node.options && node.options.var_name && node.options.default_value) {
              const { var_name } = node.options;
              if (sensitiveVarPatterns.some(pattern => pattern.test(var_name))) {
                  node.options.default_value = '[REDACTED]'; // Redact the sensitive value
              }
          }
      });
  }

  // Check if `flow_vars` exists and process `nodes` if it does
  if (processedData.matterflow.flow_vars && Array.isArray(processedData.matterflow.flow_vars.nodes)) {
      redactSensitiveDefaultValue(processedData.matterflow.flow_vars.nodes);
  }

  return processedData;
}
