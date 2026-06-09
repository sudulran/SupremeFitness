import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import axiosInstance from "../../api/axiosInstance";

const stripePromise = loadStripe(
  "pk_test_51SI13oBjSsvom7LZPDCCiIdDH82W2Kj00F1cNXwWpDueUmjoN9t61qMSdLahK0EQxZaIQddFgVsCzZxHWDnB8jG000Q5UI7D6k"
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#000",
      "::placeholder": { color: "#888" },
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      padding: "10px 12px",
    },
    invalid: { color: "red" },
  },
};

function CheckoutForm({
  cartId,
  totalAmount,
  userEmail,
  cardHolder,
  setCardHolder,
  setError,
  setSuccessMsg,
  loading,
  setLoading,
  onPaymentSuccess,
  onClose,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errors, setErrors] = useState({});

  const validateCardHolder = (name) => name.trim().length > 0;

  const handlePayment = async () => {
    setError(null);
    setSuccessMsg(null);

    const newErrors = {};
    if (!validateCardHolder(cardHolder))
      newErrors.cardHolder = "Card holder name is required.";
    if (!cartId) newErrors.cartId = "Invalid cart ID.";
    if (!userEmail) newErrors.userEmail = "User email not found.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Create PaymentIntent on backend
      const payload = {
        amount: Math.round(totalAmount * 100), // cents
        email: userEmail,
      };

      console.log("Creating payment intent...");
      const response = await axiosInstance.post("/payment/create-intent", payload);
      const clientSecret = response?.data?.clientSecret;

      if (!clientSecret) {
        console.error("Payment Intent response:", response);
        throw new Error("Failed to get client secret from backend.");
      }

      // 2️⃣ Confirm payment
      const cardElement = elements.getElement(CardElement);
      console.log("Confirming payment with Stripe...");
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardHolder.trim(),
            email: userEmail,
          },
        },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      if (paymentResult.paymentIntent.status !== "succeeded") {
        throw new Error("Payment not successful");
      }

      // 3️⃣ Record payment in backend
      console.log("Recording payment in backend...");
      await axiosInstance.post("/payment/add", {
        cartId,
        paymentIntentId: paymentResult.paymentIntent.id,
        email: userEmail,
        cardHolder: cardHolder.trim(),
      });

      // 4️⃣ Update cart status AND product quantities
      console.log("Confirming payment and updating quantities...");
      const confirmResponse = await axiosInstance.post(`/cart/confirm-payment/${cartId}`);
      
      if (!confirmResponse.data.success) {
        throw new Error("Failed to update product quantities");
      }

      setSuccessMsg("Payment successful! Product quantities updated.");
      
      // Call success callback after a short delay to show success message
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
      
    } catch (err) {
      console.error("Payment error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "white", mb: 2 }}>
        <TextField
          label="Card Holder Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          error={!!errors.cardHolder}
          helperText={errors.cardHolder}
          inputProps={{ maxLength: 50 }}
          sx={{
            input: { color: "black" },
            label: { color: "black" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: errors.cardHolder ? "red" : "gray",
              },
              "&:hover fieldset": {
                borderColor: errors.cardHolder ? "red" : "black",
              },
              "&.Mui-focused fieldset": {
                borderColor: errors.cardHolder ? "red" : "black",
              },
            },
          }}
        />
        <Box
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            p: 1,
            mb: 2,
            color: "black",
          }}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </Box>
      </Paper>

      <DialogActions
        sx={{
          px: 0,
          pb: 0,
          pt: 1,
          display: "flex",
          justifyContent: "space-between",
          bgcolor: "white",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            color: "red",
            borderColor: "red",
            "&:hover": { bgcolor: "#ffe5e5" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePayment}
          sx={{
            minWidth: 140,
            fontWeight: "bold",
            bgcolor: "red",
            color: "white",
            "&:hover": { bgcolor: "#b71c1c" },
          }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? "Processing..." : "Confirm Payment"}
        </Button>
      </DialogActions>
    </Box>
  );
}

function PaymentModal({ open, onClose, totalAmount, cartId, onPaymentSuccess }) {
  const [cardHolder, setCardHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (open) {
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUserEmail(parsedUser?.email || "");
      // Reset states when modal opens
      setError(null);
      setSuccessMsg(null);
      setCardHolder("");
      setLoading(false);
    }
  }, [open]);

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccessMsg(null);
      setCardHolder("");
      setLoading(false);
      onClose();
    }
  };

  const handlePaymentSuccess = () => {
    onPaymentSuccess();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "white", color: "black", borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "1.5rem",
          textAlign: "center",
          color: "black",
          backgroundColor: "#f5f5f5",
        }}
      >
        Secure Payment
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography
          gutterBottom
          variant="body1"
          sx={{ textAlign: "center", mb: 3, color: "black" }}
        >
          Enter your card details to complete the payment of{" "}
          <strong style={{ color: "red" }}>${totalAmount.toFixed(2)}</strong>.
        </Typography>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            cartId={cartId}
            totalAmount={totalAmount}
            userEmail={userEmail}
            cardHolder={cardHolder}
            setCardHolder={setCardHolder}
            setError={setError}
            setSuccessMsg={setSuccessMsg}
            loading={loading}
            setLoading={setLoading}
            onPaymentSuccess={handlePaymentSuccess}
            onClose={handleClose}
          />
        </Elements>

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 3,
              mb: 1,
              borderRadius: 1,
            }}
          >
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert
            severity="success"
            sx={{
              mt: 3,
              mb: 1,
              borderRadius: 1,
            }}
          >
            {successMsg}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;