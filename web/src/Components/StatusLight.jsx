import * as _ from 'lodash';
import '../styles/StatusLight.css';
import { Tooltip as AntdTooltip } from "antd";

function StatusLight(props) {
    const statuses = {
        "unconfigured": "red",
        "configured": "yellow",
        "complete": "green"
    };
    const items = _.keys(statuses).map(s =>
        <StatusLightItem color={statuses[s]} active={props.status === s} key={s} />
    );
    return (
        <AntdTooltip title="Click to Start/Stop">
        <div className="StatusLight">
            { items }
        </div>
        </AntdTooltip>            
    )
}


function StatusLightItem(props) {
    const color = props.active ? props.color : "white";
    return (
        <div className="StatusLightItem" style={{backgroundColor: color}} />
    )
}


export default StatusLight;
