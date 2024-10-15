import { useState } from "react";
import SimpleInput from "./SimpleInput";
import FileUploadInput from "./FileUploadInput";
import BooleanInput from "./BooleanInput";
import SelectInput from "./SelectInput";
import InstanceSelectInput from "./InstanceSelectInput";

import FlowVariableOverride from "./FlowVariableOverride";

import { Col, Row, Form } from "react-bootstrap";
import { Space, Typography } from "antd";

const OptionInput = (props) => {
  const [isFlow, setIsFlow] = useState(props.flowValue ? true : false);

  const handleFlowCheck = (bool) => {
    // if un-checking, fire callback with null so no stale value is in `option_replace`
    if (!bool) props.onChange(props.keyName, null, true);
    setIsFlow(bool);
  };

  // fire callback to update `option_replace` with flow node info
  const handleFlowVariable = (value) => {
    props.onChange(props.keyName, value, true);
  };

  let inputComp;
  if (props.type === "file") {
    inputComp = <FileUploadInput {...props} disabled={isFlow} />;
  } else if (props.type === "string") {
    inputComp = <SimpleInput {...props} type="text" disabled={isFlow} />;
  } else if (props.type === "text") {
    inputComp = <SimpleInput {...props} type="textarea" disabled={isFlow} />;
  } else if (props.type === "int") {
    inputComp = <SimpleInput {...props} type="number" disabled={isFlow} />;
  } else if (props.type === "boolean") {
    inputComp = <BooleanInput {...props} disabled={isFlow} />;
  } else if (props.type === "select") {
    inputComp = <SelectInput {...props} />;
  } else if (props.type === "instanceselect") {
    inputComp = <InstanceSelectInput {...props} />;
  } else {
    return <></>;
  }

  const hideFlow =
    props.node.options.is_global ||
    props.type === "file" ||
    props.flowNodes.length === 0;

  return (
    <Form.Group>
      <div>
        <Typography.Text>{props.label}</Typography.Text>
      </div>
      <Typography.Text type="secondary">{props.docstring}</Typography.Text>
      <Row>
        <Col xs={hideFlow ? 12 : 8}>{inputComp}</Col>
        {hideFlow ? null : (
          <FlowVariableOverride
            keyName={props.keyName}
            flowValue={props.flowValue || {}}
            flowNodes={props.flowNodes || []}
            checked={isFlow}
            onFlowCheck={handleFlowCheck}
            onChange={handleFlowVariable}
          />
        )}
      </Row>
      <Space direction="vertical">
        <Space></Space>
      </Space>
    </Form.Group>
  );
};

export default OptionInput;
