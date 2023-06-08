import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Container } from "react-bootstrap";

import TOKEN_ABI from "./abis/Token.json";
import CROWDSALE_ABI from "./abis/Crowdsale.json";
import config from "./config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [crowdsale, setCrowdsale] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState(0);
  const [maxTokens, setMaxTokens] = useState(0);
  const [tokensSold, setTokensSold] = useState(0);
  const [price, setPrice] = useState(0);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const { chainId } = await provider.getNetwork();

    const token = new ethers.Contract(
      config[chainId].token.address,
      TOKEN_ABI,
      provider
    );

    const crowdsale = new ethers.Contract(
      config[chainId].crowdsale.address,
      CROWDSALE_ABI,
      provider
    );

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

    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
    setIsLoading(false);
  }, [isLoading]);

  return (
    <Container>
      <h1 className="my-4 text-center">Introducing the DAPP Token!</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p className="text-center">
            <strong>Current Price: </strong>
            {price} ETH
          </p>
        </>
      )}
      <hr />
      {account && (
        <>
          <p>{account}</p>
        </>
      )}
    </Container>
  );
}

export default App;
