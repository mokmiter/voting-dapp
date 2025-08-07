const contractABI = [
  {
    "inputs": [
      { "internalType": "string[]", "name": "candidateNames", "type": "string[]" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "candidate", "type": "string" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCandidates",
    "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "candidate", "type": "string" }
    ],
    "name": "getVotes",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "name": "votesReceived",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = "0x7b07fd94929021Dc718af42Aef22FD85E397f86f";
let contract;
let currentAccount;

async function connectWallet() {
  if (window.ethereum) {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];
    document.getElementById("walletAddress").innerText = `Connected: ${currentAccount}`;
    initContract();
  } else {
    alert("Install MetaMask first!");
  }
}

async function initContract() {
  const web3 = new Web3(window.ethereum);
  contract = new web3.eth.Contract(contractABI, contractAddress);
  loadCandidates();
}

async function loadCandidates() {
  const candidates = await contract.methods.getAllCandidates().call();
  const list = document.getElementById("candidateList");
  list.innerHTML = "";

  for (const name of candidates) {
    const votes = await contract.methods.getVotes(name).call();
    const li = document.createElement("li");
    li.innerText = `${name}: ${votes} vote(s)`;
    list.appendChild(li);
  }
}

async function voteCandidate() {
  const name = document.getElementById("candidateInput").value;
  if (!name) return alert("Please enter a candidate name.");

  try {
    await contract.methods.vote(name).send({ from: currentAccount });
    document.getElementById("voteStatus").innerText = `You voted for ${name}`;
    loadCandidates();
  } catch (error) {
    console.error(error);
    alert("Vote failed. You might have already voted or name is incorrect.");
  }
}

document.getElementById("connectButton").addEventListener("click", connectWallet);
document.getElementById("voteButton").addEventListener("click", voteCandidate);
