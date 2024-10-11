import React from "react";


const BannerBox = () => {
  return (
    <>
    <div>
      <div>
        <h3>Start</h3>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          <li style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '10px', transition: 'background-color 0.3s' }}>
            <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                <path fill="currentColor" fillRule="evenodd" d="M2.75 2.5A1.75 1.75 0 001 4.25v1C1 6.216 1.784 7 2.75 7h1a1.75 1.75 0 001.732-1.5H6.5a.75.75 0 01.75.75v3.5A2.25 2.25 0 009.5 12h1.018c.121.848.85 1.5 1.732 1.5h1A1.75 1.75 0 0015 11.75v-1A1.75 1.75 0 0013.25 9h-1a1.75 1.75 0 00-1.732 1.5H9.5a.75.75 0 01-.75-.75v-3.5A2.25 2.25 0 006.5 4H5.482A1.75 1.75 0 003.75 2.5h-1zM2.5 4.25A.25.25 0 012.75 4h1a.25.25 0 01.25.25v1a.25.25 0 01-.25.25h-1a.25.25 0 01-.25-.25v-1zm9.75 6.25a.25.25 0 00-.25.25v1c0 .138.112.25.25.25h1a.25.25 0 00.25-.25v-1a.25.25 0 00-.25-.25h-1z" clipRule="evenodd"></path>
              </svg>
              <strong> New Flow</strong>
            </a>
            <p>Open a new untitled flow and drag and drop components to design and develop your data flow.</p>
          </li>
        </ul>
      </div>
      <div>
        <h3>Resources</h3>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          <li style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '10px', transition: 'background-color 0.3s' }}>
            <a href="https://github.com/MatterCoder/matterflow" target="_blank" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '8px' }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M8.012,0.186C3.585,0.186,0,3.771,0,8.198c0,3.545,2.293,6.539,5.478,7.601c0.401,0.07,0.551-0.17,0.551-0.381c0-0.19-0.01-0.821-0.01-1.492c-1.013,0.096-1.534-0.765-1.694-1.216c-0.09-0.231-0.481-0.942-0.821-1.133c-0.281-0.15-0.682-0.52-0.011-0.531c0.631-0.01,1.081,0.581,1.232,0.821c0.721,1.212,1.873,0.871,2.333,0.661c0.07-0.521,0.28-0.871,0.511-1.072c-1.783-0.2-3.645-0.891-3.645-3.956c0-0.871,0.31-1.592,0.821-2.153c-0.08-0.2-0.361-1.022,0.08-2.123c0,0,0.671-0.21,2.203,0.821c0.641-0.18,1.322-0.27,2.003-0.27c0.681,0,1.362,0.09,2.003,0.27c1.532-1.042,2.203-0.821,2.203-0.821c0.441,1.102,0.16,1.923,0.08,2.123c0.511,0.561,0.821,1.272,0.821,2.153c0,3.075-1.873,3.756-3.656,3.956c0.29,0.25,0.541,0.731,0.541,1.482c0,1.072-0.01,1.933-0.01,2.203c0,0.21,0.15,0.461,0.551,0.381c3.165-1.062,5.458-4.066,5.458-7.601C16.012,3.771,12.427,0.186,8.012,0.186z" fill="#1b1f23"></path>
              </svg>
              <strong> Issues and Feature Requests</strong>
            </a>
            <p>Report issues and suggest features on GitHub.</p>
          </li>
          <li style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '10px', transition: 'background-color 0.3s' }}>
            <a href="https://join.slack.com/t/matterflow/shared_invite/zt-2ci2ptvoy-FENw8AW4ISDXUmz8wcd3bw" target="_blank" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 2447.6 2452.5" viewBox="0 0 2447.6 2452.5" version="1.1" width="16" height="16" style={{ marginRight: '8px' }}>
                <path fill="#36c5f0" d="M897.4 0C762.1 0.1 652.6 109.9 652.7 245.2 652.6 380.5 762.2 490.3 897.5 490.4h244.8V245.3C1142.4 110 1032.8 0.2 897.4 0c0.1 0 0.1 0 0 0m0 654H244.8C109.5 654.1-0.1 763.9 0 899.2c-0.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-0.1 244.9-109.9 244.8-245.2C1142.3 763.9 1032.7 654.1 897.4 654z"></path>
                <path fill="#2eb67d" d="M2447.6 899.2C2447.7 763.9 2338.1 654.1 2202.8 654 2067.5 654.1 1957.9 763.9 1958 899.2v245.3h244.8c135.3-0.1 244.9-109.9 244.8-245.3zM1795 245.2c-0.2-135.3-109.4-245.1-244.7-245.3-135.3 0.1-244.9 109.9-244.8 245.2v654c-0.2 135.3 109.4 245.1 244.7 245.3 135.3-0.1 244.9-109.9 244.8-245.3z"></path>
                <path fill="#ecb22e" d="M1550.1 2452.5c135.3-0.1 244.9-109.9 244.8-245.2 0.1-135.3-109.4-245.1-244.7-245.3 -135.3 0.1 -244.9 109.9 -244.8 245.3v654c0.2 135.3 109.4 245.1 244.7 245.3z"></path>
              </svg>
              <strong> Join The Community</strong>
            </a>
            <p>Join our Slack community to discuss your use case and learn about Matterflow.</p>
          </li>
        </ul>
      </div>
    </div>
    </>
  );
};

export default BannerBox;
