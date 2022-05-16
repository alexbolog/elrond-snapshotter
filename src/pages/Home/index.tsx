import * as React from 'react';
import { Link } from 'react-router-dom';
import { dAppName } from 'config';
import { routeNames } from 'routes';
import { getCollectionBatch, getCollectionSize } from 'apiRequests';

const Home = () => {
  const DONE_STATUS = 'Done.';
  const [input, setInput] = React.useState('');
  const [status, setStatus] = React.useState('Waiting for ticker');
  const [collectionSize, setCollectionSize] = React.useState(0);
  const [finalObj, setFinalObj] = React.useState<any[]>([]);
  const [holdersObj, setHoldersObj] = React.useState<{ [key: string]: number }>(
    {}
  );

  const computeBalances = async (snapshot: any[]) => {
    const holders: { [key: string]: number } = {};
    for (let j = 0; j < snapshot.length; j++) {
      const crt = snapshot[j];
      if (!holders[crt.owner]) {
        holders[crt.owner] = 0;
      }
      holders[crt.owner]++;
    }
    console.log(holders);
    setHoldersObj(holders);
    setStatus(DONE_STATUS);
  };

  const handleDownloadBalanceJson = async () => {
    if (finalObj.length === 0) {
      await handleMakeSnapshot();
    }
    await downloadFile(holdersObj, 'holders');
  };

  const handleDownloadHoldersJson = async () => {
    if (finalObj.length === 0) {
      await handleMakeSnapshot();
    }
    setStatus('Fetching collection size..');
    const collSize = await fetchCollectionSize();
    setCollectionSize(collSize);
    await downloadFile(finalObj, 'snapshot');
  };

  const handleMakeSnapshot = async () => {
    setStatus('Fetching collection size..');
    const collSize = await fetchCollectionSize();
    setCollectionSize(collSize);
    const snapshot = [];
    for (let i = 0; i < collSize; i += 100) {
      setStatus(`Fetching.. Progress: ${i + 100}/${collSize}`);
      const nfts = await getCollectionBatch(input, i);
      if (!nfts.success) {
        window.alert('Something went wrong. Refresh the page and try again');
        return;
      }
      for (let j = 0; j < nfts.data.length; j++) {
        const crt = nfts.data[j];
        snapshot.push(crt);
      }
    }
    setFinalObj(snapshot);
    await computeBalances(snapshot);
  };

  const fetchCollectionSize = async () => {
    const collectionSizeResponse = await getCollectionSize(input);
    if (collectionSizeResponse.success) {
      return collectionSizeResponse.data;
    }
    return 0;
  };

  const downloadFile = async (data: any, fileName: string) => {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBalances = () => {
    const keys = Object.keys(holdersObj);
    console.log(keys);
    return keys.map((k, i) => (
      <div className='row' key={i}>
        <div className='col d-flex justify-content-center'>
          <p>
            {k}:{holdersObj[k]}
          </p>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div className='d-flex flex-fill align-items-center container'>
        <div className='row w-100'>
          <div className='col-12 col-md-8 col-lg-5 mx-auto'>
            <div className='card shadow-sm rounded p-4 border-0'>
              <div className='card-body text-center'>
                <div className='container'>
                  <div className='row'>
                    <div className='col'>
                      <h2 className='mb-3' data-testid='title'>
                        {dAppName}
                      </h2>
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col'>
                      <p className='mb-3'>
                        Input a collection ticker and get the collection
                        snapshot! (Only works for NFTs)
                      </p>
                    </div>
                  </div>
                </div>
                <div className='row'>
                  <div className='col'>
                    <input
                      type='text'
                      onChange={(e) => setInput(e.target.value ?? '')}
                    />
                  </div>
                </div>
                <div className='row'>
                  <div className='col'>
                    <p>Current status: {status}</p>
                  </div>
                </div>
                <div className='row'>
                  <div className='col'>
                    <button
                      className='btn btn-primary mt-3 text-white'
                      data-testid='loginBtn'
                      onClick={handleMakeSnapshot}
                    >
                      Make snapshot
                    </button>
                  </div>
                </div>
                {status === DONE_STATUS && (
                  <div className='row mt-5'>
                    <div className='col'>
                      <button
                        onClick={handleDownloadBalanceJson}
                        className='btn btn-success'
                      >
                        Download balances json
                      </button>
                    </div>
                    <div className='col'>
                      <button
                        onClick={handleDownloadHoldersJson}
                        className='btn btn-success'
                      >
                        Download holders json
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {status === DONE_STATUS && (
        <div className='row'>
          <div className='container'>
            <h4 className=' d-flex justify-content-center'>Balances: </h4>
            {formatBalances()}
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
