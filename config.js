const PH_CONFIG = {
  appName: "PH Estate Manager V2",
  stage: "stage-16",
  supabaseUrl: "https://rxoqinweqyrfhgdauokd.supabase.co",
  supabasePublishableKey: "sb_publishable_tsdi2vctaisygqts6iFogA_RMwFNlj4"
};

// Stage 16 hotfix bridge:
// Older Stage 15 app.js used workflowPaymentStatus during save without defining it.
// This global getter makes that value resolve safely from the live form state.
try {
  Object.defineProperty(window, "workflowPaymentStatus", {
    configurable: true,
    get() {
      try {
        return typeof getWorkflowPaymentStatus === "function" ? getWorkflowPaymentStatus() : "payment_pending";
      } catch (err) {
        return "payment_pending";
      }
    }
  });
} catch (err) {
  window.workflowPaymentStatus = "payment_pending";
}
