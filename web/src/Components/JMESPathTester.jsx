import { useState, useEffect, useCallback } from "react";
import * as jmespath from "jmespath";
import { DragOutlined } from "@ant-design/icons";
import JsonDataInput from "./JsonDataInput";

const JMESPathTester = () => {
  const [expression, setExpression] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [result, setResult] = useState("");

  const evaluateJMESPath = useCallback(() => {
    try {
      const data = JSON.parse(jsonData);
      const searchResult = jmespath.search(data, expression);
      setResult(JSON.stringify(searchResult, null, 2));
    } catch (error) {
      if (jsonData == '' || expression == '') {       
        setResult(`Try testng a JMESPath expression against your Sample JSON data and see the result here`);
      }
      else {
        setResult(`Error: ${error.message}`);
      }
    }
  }, [jsonData, expression, setResult]);

  useEffect(() => {
    evaluateJMESPath();
  }, [expression, jsonData, evaluateJMESPath]);

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
