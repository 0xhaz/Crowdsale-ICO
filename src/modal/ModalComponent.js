import { ethers } from "ethers";
import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Tabs,
  Tab,
  Form,
  Col,
  Row,
  Spinner,
} from "react-bootstrap";
import "./modal.css";

const ModalComponent = ({
  showModal,
  handleClose,
  account,
  provider,
  crowdsale,
  chainId,
}) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [minPurchase, setMinPurchase] = useState(0);
  const [maxPurchase, setMaxPurchase] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState("addresses");
  const [whitelistStatus, setWhitelistStatus] = useState([]);
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [price, setPrice] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [timezone, setTimezone] = useState("");

  const loadAdminData = async () => {
    if (!provider) return;
    try {
      const signer = await provider.getSigner();
      const startTime = await crowdsale.startTime();
      console.log("startTime", startTime.toString());
      const formattedStartTime = new Date(startTime * 1000)
        .toISOString()
        .slice(0, -8);
      setStartTime(formattedStartTime);
      const endTime = await crowdsale.endTime();
      console.log("endTime", endTime.toString());
      setEndTime(new Date(endTime * 1000).toISOString().slice(0, -8));
      const minPurchase = await crowdsale.minPurchase();
      setMinPurchase(ethers.utils.formatUnits(minPurchase, 18));
      const maxPurchase = await crowdsale.maxPurchase();
      setMaxPurchase(ethers.utils.formatUnits(maxPurchase, 18));
      const price = await crowdsale.price();
      setPrice(ethers.utils.formatUnits(price, 18));
      setIsLoading(false);
    } catch (error) {
      console.log("Error retrieving admin data", error);
    }
  };

  const fetchWhitelistStatus = async () => {
    if (!provider || !crowdsale || !chainId) return;
    try {
      const pendingAddresses = await crowdsale.getPendingStatusAddr();
      console.log("pendingAddresses", pendingAddresses);
      setWhitelistStatus(pendingAddresses);
      setSelectedAddresses(pendingAddresses);
    } catch (error) {
      console.log("Error retrieving whitelist status", error);
    }
  };

  const isPendingWhitelist = async address => {
    if (!provider || !crowdsale || !chainId) return false;
    try {
      const pendingStatus = await crowdsale.isPendingWhitelist(address);
      return pendingStatus;
    } catch (error) {
      console.log("Error retrieving whitelist status", error);
      return false;
    }
  };

  const handleApprove = async address => {
    if (!provider || !crowdsale || !chainId) return;

    try {
      const signer = await provider.getSigner();
      const transaction = await crowdsale
        .connect(signer)
        .approveWhitelist(address);
      await transaction.wait();
    } catch (error) {
      console.log("Error approving address", error);
    }
  };

  const handleApproveAll = async () => {
    if (!provider || !crowdsale || !chainId) return;

    try {
      const signer = await provider.getSigner();
      const transaction = await crowdsale
        .connect(signer)
        .approveWhitelistToAll(selectedAddresses);
      await transaction.wait();
    } catch (error) {
      console.log("Error approving address", error);
    }
  };

  const handleRejectAll = async () => {
    if (!provider || !crowdsale || !chainId) return;

    try {
      const signer = await provider.getSigner();
      const transaction = await crowdsale
        .connect(signer)
        .rejectWhitelistToAll(selectedAddresses);
      await transaction.wait();
    } catch (error) {
      console.log("Error rejecting address", error);
    }
  };

  const handleReject = async address => {
    if (!provider || !crowdsale || !chainId) return;

    try {
      const signer = await provider.getSigner();
      const transaction = await crowdsale
        .connect(signer)
        .rejectWhitelist(address);
      await transaction.wait();
    } catch (error) {
      console.log("Error rejecting address", error);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!provider || !crowdsale || !chainId) return;

    try {
      const signer = await provider.getSigner();

      setIsWaiting(true);

      let transaction = await crowdsale
        .connect(signer)
        .setPrice(ethers.utils.parseUnits(price.toString(), 18));
      await transaction.wait();

      transaction = await crowdsale
        .connect(signer)
        .setContribution(
          ethers.utils.parseUnits(minPurchase.toString(), 18),
          ethers.utils.parseUnits(maxPurchase.toString(), 18)
        );
      await transaction.wait();

      const startTimestamp = new Date(startTime).getTime() / 1000;
      const endTimestamp = new Date(endTime).getTime() / 1000;

      transaction = await crowdsale
        .connect(signer)
        .restartCampaign(startTimestamp, endTimestamp);
      await transaction.wait();

      setIsWaiting(false);
    } catch (error) {
      console.log("Error submitting form", error);
    }
  };

  const handleRefund = async () => {
    if (!provider || !crowdsale || !chainId) return;
    try {
      const signer = await provider.getSigner();

      const transaction = await crowdsale.connect(signer).setRefundStatus(true);
      await transaction.wait();
    } catch (error) {
      window.alert("Error refunding", error);
    }
  };

  const handleWithdraw = async () => {
    if (!provider || !crowdsale || !chainId) return;
    try {
      const signer = await provider.getSigner();
      const transaction = await crowdsale.connect(signer).withdrawBalance();
      await transaction.wait();
    } catch (error) {
      window.alert("Error withdrawing", error);
    }
  };

  useEffect(() => {
    loadAdminData();
    if (crowdsale && chainId) {
      fetchWhitelistStatus();
    }
  }, [crowdsale, chainId]);

  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
        setTimezone(timeZone);
      } catch (error) {
        console.log("Error retrieving timezone", error);
      }
    };
    fetchTimezone();
  }, []);

  return (
    <Modal show={showModal} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Contract Owner Panel</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          activeKey={key}
          onSelect={k => setKey(k)}
          id="admin-tabs"
          className="mb-3 tab-container"
          fill
        >
          <Tab eventKey="addresses" title="Addresses / Refund / Withdraw">
            <Row className="align-items-center">
              <Row className="align-items-center">
                <Col>
                  <p className="mb-0">Enable Refund (only when expired)</p>
                </Col>
                <Col className="text-end m-3">
                  <Button onClick={handleRefund}>Enable Refund</Button>
                </Col>
              </Row>

              <Row className="align-items-center ">
                <Col>
                  <p className="mb-0">Withdraw Balance (only if successful)</p>
                </Col>
                <Col className="text-end m-3">
                  <Button onClick={handleWithdraw}>Withdraw Balance</Button>
                </Col>
              </Row>

              <Row className="align-items-center">
                <Col>
                  <p className="mb-0">Approve / Reject Address</p>
                </Col>
                <Col className="d-flex justify-content-end">
                  <Button
                    className="m-3"
                    onClick={() => handleApproveAll()}
                    disabled={selectedAddresses.length === 0}
                  >
                    Approve All
                  </Button>
                  <Button
                    className="m-3"
                    onClick={() => handleRejectAll()}
                    disabled={selectedAddresses.length === 0}
                  >
                    Reject All
                  </Button>
                </Col>
              </Row>

              <hr />
              {whitelistStatus.map((address, index) => (
                <Row className="align-items-center" key={index}>
                  <Col>
                    <p className="mb-0">{address}</p>
                  </Col>
                  <Col className="text-end">
                    {isPendingWhitelist(address) && (
                      <>
                        <Button
                          className="m-2"
                          onClick={() => handleApprove(address)}
                          disabled={!isPendingWhitelist(address)}
                        >
                          Approve
                        </Button>
                        <Button
                          className="m-2"
                          onClick={() => handleReject(address)}
                          disabled={!isPendingWhitelist(address)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </Col>
                </Row>
              ))}
            </Row>
          </Tab>
          <Tab eventKey="form" title="Form">
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="price">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter new price"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="minPurchase">
                <Form.Label>Min Purchase</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter min purchase"
                  value={minPurchase}
                  onChange={e => setMinPurchase(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="maxPurchase">
                <Form.Label>Max Purchase</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter max purchase"
                  value={maxPurchase}
                  onChange={e => setMaxPurchase(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="startTime">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
                {timezone && <p className="text-muted">Timezone: {timezone}</p>}
              </Form.Group>
              <Form.Group controlId="endTime">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
                {timezone && <p className="text-muted">Timezone: {timezone}</p>}
              </Form.Group>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        {isWaiting ? (
          <Spinner animation="border" role="status" />
        ) : (
          <>
            <Button variant="primary" onClick={handleSubmit}>
              Submit
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalComponent;
