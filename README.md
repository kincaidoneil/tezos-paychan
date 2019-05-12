# tezos-paychan

> Payment channel client and smart contract for Tezos

### Usage

1. Open the OCamlPro's [Liquidity online editor](http://www.liquidity-lang.org/edit)
2. Enable ReasonML mode
3. Paste contract source
4. Compile the contract
5. Run the Node.js script in this repo to generate a payment channel claim for 100000 base units
6. Now, to close the channel using the paychan claim, navigate to the "Test" tab in Liquidity
7. Paste this into the storage:
```
{
  status: Open,
  signingKey: edpkuccTQmg2sSPHZWL3L15stb2HXd2qbtyLMsJDXPCf6aummpDKjC,
  sender: edpkuccTQmg2sSPHZWL3L15stb2HXd2qbtyLMsJDXPCf6aummpDKjC,
  recipient: edpkuccTQmg2sSPHZWL3L15stb2HXd2qbtyLMsJDXPCf6aummpDKjC
}
```
8. Paste this as the main parameter:
`(0.1tz, edsigtrGqNJv8oKaNFcvpV8jSYZjeggx7dwfnuwxiGvnFxKtzmhYJu6K2UVsaAVj5L6tHkjRihSH9T8ypUBAzrJeYpr6VQeXG8Y)` (alternatively, generate a signature with different keys for sender and receiver, and varying amounts)
9. Set a value for the amount in the contract higher than the value of the claim
9. Click run! Liquidity will execute the channel close locally, showing a transfer of 0.1tz to the receiver, and the remainder of the value of the contract goes back to the sender.
