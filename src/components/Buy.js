import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";
import { ethers } from "ethers";

const Buy = ({ provider, price, crowdsale, setIsLoading }) => {
  const [amount, setAmount] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [minPurchase, setMinPurchase] = useState(100); // Updated initial value to 100
  const [maxPurchase, setMaxPurchase] = useState(10000); // Updated initial value to 10000

  useEffect(() => {
    const fetchPurchaseLimits = async () => {
      const minPurchase = await crowdsale.minPurchase();
      setMinPurchase(ethers.utils.formatUnits(minPurchase, 18));

      const maxPurchase = await crowdsale.maxPurchase();
      setMaxPurchase(ethers.utils.formatUnits(maxPurchase, 18));
    };

    fetchPurchaseLimits();
  }, [crowdsale]);

  const buyHandler = async e => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();

      const value = ethers.utils.parseUnits(
        (amount * price).toString(),
        "ether"
      );
      const formattedAmount = ethers.utils.parseUnits(
        amount.toString(),
        "ether"
      );

      const transaction = await crowdsale
        .connect(signer)
        .buyTokens(formattedAmount, { value });

      await transaction.wait();
    } catch (err) {
      window.alert("User rejected transaction or transaction reverted");
    }

    setIsLoading(true);
  };

  return (
    <Form
      onSubmit={buyHandler}
      style={{ maxWidth: "800px", margin: "50px auto" }}
    >
      <Form.Group as={Row} controlId="formAmount">
        <Col>
          <Form.Control
            type="number"
            placeholder="Enter Amount"
            min={minPurchase}
            max={maxPurchase}
            onChange={e => setAmount(e.target.value)}
          />
        </Col>
        <Col className="text-center">
          {isWaiting ? (
            <Spinner animation="border" variant="primary" />
          ) : (
            <Button variant="primary" type="submit" style={{ width: "100%" }}>
              Buy Tokens
            </Button>
          )}
        </Col>
      </Form.Group>
      <Form.Group as={Row}>
        <Col className="text-center">
          <p className="my-3">
            <strong>Min Purchase:</strong> {minPurchase}{" "}
            <strong>Max Purchase:</strong> {maxPurchase}
          </p>
        </Col>
      </Form.Group>
    </Form>
  );
};

export default Buy;
