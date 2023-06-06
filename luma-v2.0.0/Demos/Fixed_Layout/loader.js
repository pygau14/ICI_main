document.addEventListener("DOMContentLoaded", function() {
    // Display the loader when the page starts loading
    document.querySelector(".loader").style.display = "block";
  
    // Hide the loader when the page has finished loading
    window.addEventListener("load", function() {
      document.querySelector(".loader").style.display = "none";
    });
  });
  
  // Function to show loader
  function showLoader() {
    console.log('showing loader');
    document.querySelector(".loader").style.display = "block";
  }
  
  // Function to hide loader
  function hideLoader() {
    document.querySelector(".loader").style.display = "none";
  }
  