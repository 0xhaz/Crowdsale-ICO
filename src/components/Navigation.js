import { useState, useEffect } from "react";
import { Navbar, Row, Col, Container, Button, Modal } from "react-bootstrap";
import { ethers } from "ethers";
import logo from "../logo.png";
import ModalComponent from "../modal/ModalComponent";

const Navigation = ({ provider, crowdsale, account, chainId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const connectWallet = async () => {
    if (!provider || !window.ethereum) {
      window.alert("Please install MetaMask");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const account = ethers.utils.getAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.log("Error retrieving account", error);
    }
  };

  const handleAdmin = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const handleAccountsChanged = async accounts => {
      const newAccount = ethers.utils.getAddress(accounts[0]);
      setIsConnected(accounts.length > 0);

      if (crowdsale && newAccount) {
        try {
          const signer = provider.getSigner();
          const contractOwner = await crowdsale.owner();
          setIsAdmin(newAccount.toLowerCase() === contractOwner.toLowerCase());
        } catch (error) {
          console.log("Error retrieving contract owner", error);
        }
      }
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
  }, [crowdsale]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (crowdsale && account) {
        try {
          const signer = provider.getSigner();
          const contractOwner = await crowdsale.owner();
          setIsAdmin(account.toLowerCase() === contractOwner.toLowerCase());
        } catch (error) {
          console.log("Error retrieving contract owner", error);
        }
      }
    };

    checkAdminStatus();
  }, [crowdsale, account]);

  return (
    <Navbar>
      <Container fluid>
        <Navbar.Brand href="#">
          <img
            src={logo}
            width="40"
            height="40"
            alt="logo"
            className="d-inline-block align-top mx-3"
          />
          DApp ICO Crowdsale
        </Navbar.Brand>
        <Row className="align-items-center">
          <Col>
            <Button
              variant="primary"
              onClick={handleAdmin}
              disabled={!isConnected}
              // disabled={!isConnected || !isAdmin}
            >
              Admin
            </Button>
          </Col>
          <Col>
            <Button
              variant="outline-primary"
              onClick={connectWallet}
              disabled={isConnected}
            >
              {isConnected ? "Connected" : "Connect"}
            </Button>
          </Col>
        </Row>
      </Container>
      <ModalComponent
        showModal={showModal}
        handleClose={handleClose}
        account={account}
        provider={provider}
        crowdsale={crowdsale}
        chainId={chainId}
      />
    </Navbar>
  );
};

export default Navigation;
