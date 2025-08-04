let web3;
let contract;
const contractAddress = "0xYourContractAddress"; // Replace with your contract address

const contractABI = [ /* Copy ABI from Remix after compilation */ ];

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        contract = new web3.eth.Contract(contractABI, contractAddress);
        loadCandidates();
    } else {
        alert("Install MetaMask");
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
        document.getElementById("status").innerText = "Vote cast successfully!";
        loadCandidates(); // refresh vote count
    } catch (err) {
        document.getElementById("status").innerText = err.message;
    }
}
