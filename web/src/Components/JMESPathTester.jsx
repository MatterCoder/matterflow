import React, { useState, useEffect } from "react";
import * as jmespath from "jmespath";
import NodeDataExplorer from "./NodeDataExplorer";
import { DragOutlined } from "@ant-design/icons";
import JsonDataInput from "./JsonDataInput";

const JMESPathTester = () => {
  const [expression, setExpression] = useState(
    '[?node_id == `1`].attributes."0"."40"."1"'
  );
  const [jsonData, setJsonData] = useState();
  const [result, setResult] = useState("");

  useEffect(() => {
    evaluateJMESPath();
  }, [expression, jsonData]);

  const evaluateJMESPath = () => {
    try {
      const data = JSON.parse(jsonData);
      const searchResult = jmespath.search(data, expression);
      setResult(JSON.stringify(searchResult, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleNodeDataSelected = (jsonObject) => {
    setJsonData(JSON.stringify(jsonObject));
  };

  return (
    <div>
      <form>
        <div className="jmes-express">
          <h3>
            <strong>Test JMESPath Expression</strong>
          </h3>
          <div className="flex">
            <div
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData("text", expression);
              }}
            >
              <DragOutlined
                style={{ height: 40, width: 22, fontSize: 20, color: "grey" }}
              />
            </div>
            <textarea
              placeholder="Expression"
              className="form-control jmespath-expression"
              rows="1"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
            />
          </div>
        </div>
        <h3>
          <strong>Sample JSON</strong>
        </h3>
        {/* Replace textarea and file input with JsonDataInput */}
        <JsonDataInput jsonData={jsonData} setJsonData={setJsonData} />        
      </form>
      <div className="jmes-result">
        <h3>
          <strong>Result</strong>
        </h3>
        <pre className="jmespath-result">{result}</pre>
      </div>
    </div>
  );
};

export default JMESPathTester;
