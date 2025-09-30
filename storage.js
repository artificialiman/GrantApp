const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(`grantapp_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(`grantapp_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },
  
  clear(key) {
    try {
      localStorage.removeItem(`grantapp_${key}`);
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }
};