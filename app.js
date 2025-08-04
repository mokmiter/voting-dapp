const contractAddress = "0x15db426680B596B34413498E1D016f5681b83a23";

const contractABI = [
	{
		"inputs": [
			{
				"internalType": "string[]",
				"name": "candidateNames",
				"type": "string[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "candidateIndex",
				"type": "uint256"
			}
		],
		"name": "vote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "candidates",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "voteCount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCandidates",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "voteCount",
						"type": "uint256"
					}
				],
				"internalType": "struct Voting.Candidate[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "hasVoted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let web3;
let contract;

async function connectWallet() {
	if (window.ethereum) {
		web3 = new Web3(window.ethereum);
		await window.ethereum.request({ method: "eth_requestAccounts" });
		contract = new web3.eth.Contract(contractABI, contractAddress);
		document.getElementById("status").innerText = "Wallet connected";
		loadCandidates();
	} else {
		alert("Please install MetaMask to use this DApp.");
	}
}

async function loadCandidates() {
	const candidates = await contract.methods.getCandidates().call();
	const container = document.getElementById("candidates");
	container.innerHTML = "";

	candidates.forEach((cand, index) => {
		const btn = document.createElement("button");
		btn.innerText = `${cand.name} (${cand.voteCount} votes)`;
		btn.onclick = () => vote(index);
		container.appendChild(btn);
	});
}

async function vote(index) {
	const accounts = await web3.eth.getAccounts();
	try {
		await contract.methods.vote(index).send({ from: accounts[0] });
		document.getElementById("status").innerText = "✅ Vote cast successfully!";
		loadCandidates(); // refresh votes
	} catch (err) {
		document.getElementById("status").innerText = "❌ " + err.message;
	}
}
