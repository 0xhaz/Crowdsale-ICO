import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Container } from "react-bootstrap";

import TOKEN_ABI from "./abis/Token.json";
import CROWDSALE_ABI from "./abis/Crowdsale.json";
import config from "./config.json";

import Navigation from "./components/Navigation";
import Buy from "./components/Buy";
import Progress from "./components/Progress";
import Info from "./components/Info";
import CountdownTimer from "./components/CountdownTimer";

function App() {
  const [provider, setProvider] = useState(null);
  const [crowdsale, setCrowdsale] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState(0);
  const [maxTokens, setMaxTokens] = useState(0);
  const [tokensSold, setTokensSold] = useState(0);
  const [price, setPrice] = useState(0);
  const [chainId, setChainId] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const loadBlockchainData = async () => {
    if (!window.ethereum) {
      window.alert("Please install MetaMask");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const { chainId } = await provider.getNetwork();
    setChainId(chainId);

    const token = new ethers.Contract(
      config[chainId].token.address,
      TOKEN_ABI.abi,
      provider
    );

    const crowsaleAddress = config[chainId].crowdsale.address;
    const signer = provider.getSigner();
    const crowdsale = new ethers.Contract(
      config[chainId].crowdsale.address,
      CROWDSALE_ABI.abi,
      signer
    );
    setCrowdsale(crowdsale);

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    const accountBalance = ethers.utils.formatUnits(
      await token.balanceOf(account),
      18
    );
    setAccountBalance(accountBalance);

    const price = await crowdsale.price();
    setPrice(ethers.utils.formatUnits(price, 18));

    const maxTokens = await crowdsale.maxTokens();
    setMaxTokens(ethers.utils.formatUnits(maxTokens, 18));

    const tokensSold = await crowdsale.tokensSold();
    setTokensSold(ethers.utils.formatUnits(tokensSold, 18));

    const startTime = await crowdsale.startTime();
    setStartTime(startTime.toNumber() * 1000); // Convert to milliseconds

    const endTime = await crowdsale.endTime();
    setEndTime(endTime.toNumber() * 1000); // Convert to milliseconds

    setIsLoading(false);
  };

  useEffect(() => {
    loadBlockchainData();
    const handleAccountsChanged = accounts => {
      const newAccount = ethers.utils.getAddress(accounts[0]);
      setAccount(newAccount);
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  return (
    <Container>
      <Navigation
        provider={provider}
        crowdsale={crowdsale}
        account={account}
        chainId={chainId}
      />
      <h1 className="my-4 text-center">Introducing the DAPP Token!</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className="text-center">
            <strong>Current Price: </strong>
            {price} ETH
          </p>
          {startTime && endTime && (
            <CountdownTimer
              startTime={new Date(startTime)}
              endTime={new Date(endTime)}
            />
          )}

          <Buy
            provider={provider}
            crowdsale={crowdsale}
            price={price}
            setIsLoading={setIsLoading}
          />

          <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
        </>
      )}
      <hr />
      {account && (
        <Info
          account={account}
          crowdsale={crowdsale}
          provider={provider}
          accountBalance={accountBalance}
          setIsLoading={setIsLoading}
        />
      )}
    </Container>
  );
}

export default App;
