'use client'

import { ECDSAProvider, getRPCProviderOwner } from '@zerodev/sdk'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base'
import { useEffect, useState } from 'react';
import abi from "./Mint.json";
import { encodeFunctionData, parseAbi } from 'viem';
import { ethers } from 'ethers';

const contractAddress = "0x795EF5Da7FfA14CBc42DB628F0a0d44FD36545Dd"



const WalletContext: any = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [userData, setUserData] = useState<any>({});
    const [signer, setSigner] = useState<ECDSAProvider | null>(null);
    const [address, setAddress] = useState("");
    const [loader, setLoader] = useState(false);
    const [mintLoader, setMintLoader] = useState(false);
    const [nameLoader, setNameLoader] = useState(false);
    const [authMintLoader, setAuthMintLoader] = useState(false);
    const [loadingInit, setLoadingInit] = useState(true);
    const [logoutLoader, setLogoutLoader] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const storedIsLoggedIn = localStorage.getItem('isLoggedIn');
                if (storedIsLoggedIn) {
                    setIsLoggedIn(JSON.parse(storedIsLoggedIn));
                }
                const auth = new Web3Auth({
                    clientId: "BKSVKRjxiK3OYqrH94cjJKPpXwQ0DHBc8IBiDK2iUpouHpvdnObI3ngbs1GQzI7gWKFtJ9xnai0mRvJ5ceT-xLE",
                    chainConfig: {
                        chainNamespace: CHAIN_NAMESPACES.EIP155,
                        chainId: "0x13881",
                        rpcTarget: "https://rpc.ankr.com/polygon_mumbai/0c93d6a66d3380a8c125a7e1ce13378eaf03bfa0aa7a8688da1caa10f415dd70"
                    },
                    web3AuthNetwork: "sapphire_devnet"
                });
                await auth.initModal();
                setWeb3Auth(auth);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingInit(false); //check provider to get surely
            }
        };
        init();
    }, [])

    const connect = async () => {
        try {
            if (!web3auth) {
                console.error("Web3Auth not initialized yet");
                // Handle the case where Web3Auth is not initialized
                return;
            }
            setLoader(true);
            const web3authProvider = await web3auth.connect();
            if (!web3authProvider) {
                console.error("Web3Auth provider not available");
                // Handle the case where Web3Auth provider is not available
                setLoader(false);
                return;
            }
            setProvider(web3authProvider);
            const signer = await ECDSAProvider.init({
                projectId: "819e434d-fb8f-41d0-bf5c-25da54c66894",
                owner: getRPCProviderOwner(web3authProvider),
                opts: {
                    paymasterConfig: {
                        policy: "VERIFYING_PAYMASTER",
                    }
                }
            });

            if (!signer) {
                console.error("Unable to initialize ECDSAProvider");
                // Handle the case where ECDSAProvider initialization fails
                setLoader(false);
                return;
            }

            const zeroAddress = await signer.getAddress();
            if (!zeroAddress) {
                console.error("Unable to retrieve address from signer");
                // Handle the case where address retrieval fails
                setLoader(false);
                return;
            }
            setAddress(zeroAddress);
            setSigner(signer);
            setLoader(false);
            setIsLoggedIn(true); // Update the state to indicate the user is logged in
            localStorage.setItem('isLoggedIn', JSON.stringify(true));
        } catch (error) {
            setLoader(false);
            console.error("Login error", error);
            // Handle the login error, display a message, etc.
        }
    };


    const disconnect = async () => {
        try {
            if (!web3auth) {
                console.log("web3auth not initialized yet");
                return;
            };
            setLogoutLoader(true);
            await web3auth.logout();
            setProvider(null);
            setUserData({});
            setLogoutLoader(false);
            setIsLoggedIn(false);
            localStorage.removeItem('isLoggedIn');
        } catch (error) {
            console.log("logout", error)
        }
    };

    const getData = async () => {
        try {
            if (!provider) {
                console.log("Provider not available");
                return;
            }
            const ethersProvider = new ethers.providers.Web3Provider(provider as IProvider);
            const user = await web3auth?.getUserInfo();
            console.log(user);
            console.log("provider", provider);

            const chainId = (await ethersProvider.getNetwork()).chainId.toString();
            console.log("chainId", chainId);

            const zeroBalance = await ethersProvider.getBalance(address);
            const zeroBalanceInEther = ethers.utils.formatUnits(zeroBalance, "ether");
            console.log("zeroBalance", zeroBalanceInEther);

            const zeroAccount = signer?.getAccount();
            console.log("zeroAccount", zeroAccount);

        } catch (error) {
            // Handle errors when fetching user info
            console.error("Error fetching user info:", error);
        }
    };

    const zeroSentETH = async () => {
        try {
            if (!provider || !signer) {
                console.log("Provider or signer not available");
                return;
            }
            setLoader(true);
            const { hash }: any = await signer?.sendUserOperation({
                target: "0xaaC3A7B643915d17eAcc3DcFf8e1439fB4B1a3D2",
                data: '0x',
                value: ethers.utils.parseEther("0.1").toBigInt(),
            });
            const response = await signer?.waitForUserOperationTransaction(hash);
            console.log("sentResponse", response);
            setLoader(false)
        } catch (error) {
            console.error(error);
        }
    };

    const zeroMint = async () => {
        try {
            if (!provider || !signer) {
                console.log("Provider or signer not available");
                return;
            }
            setMintLoader(true);
            const contractABI = parseAbi([
                'function safeMint(address to) public'
            ]);

            const { hash }: any = await signer?.sendUserOperation({
                target: contractAddress,
                data: encodeFunctionData({
                    abi: contractABI,
                    functionName: "safeMint",
                    args: ["0x72F8f5bDc6E8a92dF64e4B22fe7A8050f007386a"]
                })
            });
            const response = await signer?.waitForUserOperationTransaction(hash);
            console.log("mintResponse", response);

            setMintLoader(false);
        } catch (error) {
            setMintLoader(false);
            console.error(error)
        }
    };

    const callName = async () => {
        try {
            if (!provider) {
                console.log("Provider or signer not available");
                return;
            }
            setNameLoader(true);
            const etherProvider = new ethers.providers.Web3Provider(provider as IProvider);
            const etherSigner = etherProvider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi.abi, etherSigner);
            const name = await contract.name();
            console.log("token_name", name);
            setNameLoader(false)
        } catch (error) {
            setNameLoader(false);
            console.log(error)
        }
    }

    const web3authMint = async () => {
        try {
            if (!provider || !signer) {
                console.log("Provider or signer not available");
                return;
            }
            setAuthMintLoader(true);
            const etherProvider = new ethers.providers.Web3Provider(provider as IProvider);
            const etherSigner = etherProvider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi.abi, etherSigner);
            const { hash } = await contract.safeMint(address);
            console.log("web3authMint", hash);
            setAuthMintLoader(false);
        } catch (error) {
            setAuthMintLoader(false);
            console.log(error)
        }
    }

    const loggedInView = (
        <>
            <span>{address}</span>
            <button onClick={getData} className=' bg-gray-400 px-6 py-2 rounded'>user data</button>
            <button onClick={zeroSentETH} className='bg-gray-400 px-6 py-2 rounded'>
                {
                    loader ? "loading" : "zero sent eth"
                }
            </button>
            <button onClick={zeroMint} className='bg-gray-400 px-6 py-2 rounded'>
                {
                    mintLoader ? "loading" : "zero mint"
                }
            </button>
            <button onClick={callName} className='bg-gray-400 px-6 py-2 rounded'>
                {
                    nameLoader ? "loading" : "call name"
                }
            </button>
            <span>must have gas fee</span>
            <button onClick={web3authMint} className='bg-gray-400 px-6 py-2 rounded'>
                {
                    authMintLoader ? "loading" : "web3auth mint"
                }
            </button>
            <button onClick={disconnect} className='bg-gray-400 px-6 py-2 rounded'>
                {logoutLoader ? "loading..." : "logout"}
            </button>
        </>
    );

    const unLoggedInView = (
        <button onClick={connect} className='bg-gray-400 px-6 py-2 rounded' >
            {loader ? "loading" : 'login'}
        </button>
    )

    return (
        <div className='flex flex-col justify-center items-center space-y-2'>
            {loadingInit ? (
                <span>Loading...</span>
            ) : isLoggedIn && provider ? (
                loggedInView
            ) : (
                unLoggedInView
            )}
        </div>
    )
}

export default WalletContext