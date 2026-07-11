/**
 * Application Configurations & State
 */
const CONTRACT_ADDRESS = "0x7b07fd94929021Dc718af42Aef22FD85E397f86f";
const CONTRACT_ABI = [
  { "inputs": [{ "internalType": "string[]", "name": "candidateNames", "type": "string[]" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [{ "internalType": "string", "name": "candidate", "type": "string" }], "name": "vote", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "getAllCandidates", "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "candidate", "type": "string" }], "name": "getVotes", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "hasVoted", "outputs": [{ "্তিকName": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "", "type": "string" }], "name": "votesReceived", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

let web3Instance = null;
let votingContract = null;
let currentAccount = null;

// Cache DOM elements to prevent constant lookups
const dom = {
  connectBtn: document.getElementById("connectButton"),
  walletAddress: document.getElementById("walletAddress"),
  candidateList: document.getElementById("candidateList"),
  candidateInput: document.getElementById("candidateInput"),
  voteForm: document.getElementById("voteForm"),
  voteBtn: document.getElementById("voteButton"),
  voteStatus: document.getElementById("voteStatus")
};

/**
 * Handle Wallet Connection
 */
async function handleWalletConnect() {
  if (!window.ethereum) {
    showStatus("Please install MetaMask to interact with this application.", "error");
    return;
  }

  try {
    setLoadingState(dom.connectBtn, true, "Connecting...");
    
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];

    // Update wallet address UI
    const shortAddress = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    dom.walletAddress.innerText = `Connected: ${shortAddress}`;
    dom.walletAddress.classList.remove("hidden");
    dom.connectBtn.classList.add("hidden");

    initContract();
    setupAccountListeners();
  } catch (error) {
    console.error("Wallet connection failed:", error);
    showStatus("Failed to connect wallet.", "error");
    setLoadingState(dom.connectBtn, false, "Connect Wallet");
  }
}

/**
 * Initialize Web3 and Contract Instance
 */
function initContract() {
  try {
    web3Instance = new Web3(window.ethereum);
    votingContract = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    loadCandidates();
  } catch (error) {
    console.error("Contract initialization failed:", error);
    showStatus("Error tracking smart contract.", "error");
  }
}

/**
 * Fetch and Render Candidates 
 */
async function loadCandidates() {
  if (!votingContract) return;

  try {
    dom.candidateList.innerHTML = `<li class="loading-placeholder">Fetching candidates from blockchain...</li>`;
    const candidates = await votingContract.methods.getAllCandidates().call();
    
    // Performance Optimization: Run candidate vote calls in parallel instead of a serial loop
    const candidateDataPromises = candidates.map(async (name) => {
      const votes = await votingContract.methods.getVotes(name).call();
      return { name, votes };
    });

    const resolvedCandidates = await Promise.all(candidateDataPromises);
    
    // Clear and build the list fragment
    dom.candidateList.innerHTML = "";
    const listFragment = document.createDocumentFragment();

    resolvedCandidates.forEach(({ name, votes }) => {
      const li = document.createElement("li");
      li.className = "candidate-item";
      li.innerHTML = `
        <span class="candidate-name">${name}</span>
        <span class="vote-count">${votes} ${votes === "1" ? "vote" : "votes"}</span>
      `;
      listFragment.appendChild(li);
    });

    dom.candidateList.appendChild(listFragment);
  } catch (error) {
    console.error("Failed to load candidates:", error);
    dom.candidateList.innerHTML = `<li class="error-placeholder">Error fetching candidate standings.</li>`;
  }
}

/**
 * Transaction Submission for Casting Votes
 */
async function submitVote(event) {
  event.preventDefault(); // Stop native form reloading
  
  if (!currentAccount || !votingContract) {
    showStatus("Please connect your wallet first.", "error");
    return;
  }

  const candidateName = dom.candidateInput.value.trim();
  if (!candidateName) {
    showStatus("Please type a valid candidate name.", "error");
    return;
  }

  try {
    setLoadingState(dom.voteBtn, true, "Processing Tx...");
    showStatus("Please confirm the transaction in MetaMask...", "info");

    // Check if account has already voted to fail gracefully before executing transaction gas costs
    const alreadyVoted = await votingContract.methods.hasVoted(currentAccount).call();
    if (alreadyVoted) {
      throw new Error("This wallet address has already cast a ballot.");
    }

    await votingContract.methods.vote(candidateName).send({ from: currentAccount });
    
    showStatus(`Success! Your vote for "${candidateName}" has been recorded.`, "success");
    dom.candidateInput.value = ""; // Clear input on success
    loadCandidates();
  } catch (error) {
    console.error("Voting failed:", error);
    const fallbackMessage = "Vote rejected. Ensure the spelling matches or check if you've voted already.";
    showStatus(error.message || fallbackMessage, "error");
  } finally {
    setLoadingState(dom.voteBtn, false, "Submit Vote");
  }
}

/**
 * Event Listeners & Network Listeners
 */
function setupAccountListeners() {
  if (window.ethereum) {
    // Reload UI seamlessly if user swaps active MetaMask accounts
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        // Disconnected completely
        dom.walletAddress.classList.add("hidden");
        dom.connectBtn.classList.remove("hidden");
        dom.candidateList.innerHTML = "";
        currentAccount = null;
      } else {
        currentAccount = accounts[0];
        handleWalletConnect();
      }
    });
  }
}

/**
 * UI Support Utility Functions
 */
function showStatus(message, type = "info") {
  dom.voteStatus.innerText = message;
  dom.voteStatus.className = `status-message status-${type}`;
}

function setLoadingState(buttonElement, isLoading, text) {
  buttonElement.disabled = isLoading;
  buttonElement.innerText = text;
}

// Event Bindings
dom.connectBtn.addEventListener("click", handleWalletConnect);
dom.voteForm.addEventListener("submit", submitVote);
