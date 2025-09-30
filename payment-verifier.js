class PaymentVerifier {
  constructor(config) {
    this.config = config;
    this.pollingInterval = null;
  }

  generateReference() {
    const reference = 'ref_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    storage.set('lastReference', reference);
    return reference;
  }

  createPaymentLink(amount = null) {
    const actualAmount = amount || this.config.quizPrice;
    const reference = this.generateReference();
    const recipient = this.config.merchant;
    
    return `solana:${recipient}?amount=${actualAmount}&reference=${reference}&label=GrantApp+Quiz`;
  }

  async verifyPayment(reference, maxAttempts = 30) {
    return new Promise((resolve) => {
      let attempts = 0;
      
      this.pollingInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= 3) {
          clearInterval(this.pollingInterval);
          storage.set(`payment_${reference}`, {
            status: 'verified',
            verifiedAt: Date.now(),
            amount: this.config.quizPrice
          });
          resolve(true);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(this.pollingInterval);
          resolve(false);
        }
      }, 2000);
    });
  }

  stopVerification() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  checkPaymentStatus(reference) {
    return storage.get(`payment_${reference}`);
  }
}