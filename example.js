function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  const data = isValidUrl("http://gautam.io")

  console.log(data)