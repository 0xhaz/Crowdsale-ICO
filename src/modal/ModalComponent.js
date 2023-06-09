import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { Modal, Button, Tabs, Tab, Form, Col, Row } from "react-bootstrap";
import "./modal.css";
import config from "../config.json";

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

  const loadAdminData = async () => {
    if (!provider) return;
    try {
      const signer = await provider.getSigner();
      const startTime = await crowdsale.startTime();
      setStartTime(startTime);
      const endTime = await crowdsale.endTime();
      setEndTime(endTime);
      const minPurchase = await crowdsale.minPurchase();
      setMinPurchase(ethers.utils.formatUnits(minPurchase, 18));
      const maxPurchase = await crowdsale.maxPurchase();
      setMaxPurchase(ethers.utils.formatUnits(maxPurchase, 18));
      setIsLoading(false);
    } catch (error) {
      console.log("Error retrieving admin data", error);
    }
  };

  const fetchWhitelistStatus = async addresses => {
    if (!provider || !crowdsale || !chainId) return;
    try {
      const status = await crowdsale.getWhitelistStatusAll(addresses);
      const pendingAddresses = [];
      for (let i = 0; i < addresses.length; i++) {
        if (status[i] === 0) {
          pendingAddresses.push(addresses[i]);
        }
      }
      console.log("Pending addresses", pendingAddresses);
      setWhitelistStatus(pendingAddresses);
    } catch (error) {
      console.log("Error retrieving whitelist status", error);
    }
  };

  useEffect(() => {
    loadAdminData();
    if (crowdsale && chainId) {
      fetchWhitelistStatus([config[chainId].crowdsale.address]);
    }
  }, [crowdsale, chainId]);

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
          <Tab eventKey="addresses" title="Addresses">
            <Row className="align-items-center">
              <Col>
                <p className="mb-0">Approve / Reject Address</p>
              </Col>
              <Col className="d-flex justify-content-end">
                <Button className="m-3">Approve All</Button>
                <Button className="m-3">Reject All</Button>
              </Col>
              <hr />

              {whitelistStatus.map((address, index) => (
                <Row className="align-items-center" key={index}>
                  <Col>
                    <p className="mb-0">{address}</p>
                  </Col>
                  <Col className="text-end">
                    <Button className="m-2">Approve</Button>
                    <Button className="m-2">Reject</Button>
                  </Col>
                </Row>
              ))}
            </Row>
          </Tab>
          <Tab eventKey="form" title="Form">
            <Form>
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
              </Form.Group>
              <Form.Group controlId="endTime">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalComponent;
