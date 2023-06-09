import { useState, useEffect } from "react";
import { Container, Col, Row, Spinner, Button } from "react-bootstrap";

const Info = ({
  account,
  crowdsale,
  provider,
  accountBalance,
  setIsLoading,
}) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [whiteListRequest, setWhiteListRequest] = useState("");
  const [isRequestingWhitelist, setIsRequestingWhitelist] = useState(false);
  const [showWhitelistMessage, setShowWhitelistMessage] = useState(false);
  const [hasRequestedWhitelist, setHasRequestedWhitelist] = useState(false);

  useEffect(() => {
    if (whiteListRequest) {
      setHasRequestedWhitelist(true);
    }
  }, [whiteListRequest]);

  const handleStatus = async () => {
    setIsWaiting(true);
    try {
      const isWhitelisted = await crowdsale.getWhitelistStatus(account);
      setIsWhitelisted(isWhitelisted);
      setShowWhitelistMessage(true);
    } catch (error) {
      window.alert(
        "There was an error while checking whitelist status, please try again later"
      );
    }
    setIsWaiting(false);
  };

  const handleRequest = async () => {
    setIsRequestingWhitelist(true);
    try {
      const signer = await provider.getSigner();
      const whiteListRequest = await crowdsale
        .connect(signer)
        .requestWhitelist();
      await whiteListRequest.wait();
      setWhiteListRequest(whiteListRequest);
    } catch (error) {
      window.alert("You have already requested for whitelist");
    }
    setIsRequestingWhitelist(false);
  };
  return (
    <Container className="my-3">
      <Row>
        <Col md={5}>
          <p>
            <strong>Account: </strong>
            {account}
          </p>
          <p>
            <strong>Tokens Owned: </strong>
            {accountBalance}
          </p>
        </Col>
        <Col md={{ span: 5, offset: 2 }}>
          <Row>
            <Col>
              <p>
                <strong>Check Your Eligibility Here</strong>
              </p>
              <Row className="align-items-center">
                <Col>
                  <Button
                    variant="primary"
                    type="submit"
                    style={{ width: "100%" }}
                    onClick={handleStatus}
                  >
                    Can Buy Tokens?
                  </Button>
                </Col>
                <Col>
                  {isWaiting && (
                    <Spinner animation="border" variant="primary" />
                  )}
                  {isWhitelisted !== null &&
                    !isWaiting &&
                    showWhitelistMessage && (
                      <p className="my-3">
                        {isWhitelisted
                          ? "You are whitelisted"
                          : "You are not whitelisted"}
                      </p>
                    )}
                </Col>
              </Row>
            </Col>
          </Row>
          <Row className="align-items-center my-3">
            <Col>
              <Button
                variant="primary"
                type="submit"
                style={{ width: "100%" }}
                onClick={handleRequest}
                disabled={hasRequestedWhitelist}
              >
                Request for Whitelist
              </Button>
            </Col>
            <Col>
              {isRequestingWhitelist && (
                <Spinner animation="border" variant="primary" />
              )}
              {whiteListRequest && !isRequestingWhitelist && (
                <p className="my-3">
                  Please wait for the admin to approve your request
                </p>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Info;
