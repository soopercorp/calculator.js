calculator.js
=============

A simple calculator API in Node

Just visit http://hr.xen.prgmr.com:8000, and you shall be guided toward the light.

##Its Easy
All API requests are to be sent via HTTP GET.
The methods are as defined below:

- **/api/new?email=john@doe.com**  : Register for a new api Key.. It is Mandatory that you do so (though you can provide a fake email ID)!! You will be returned a JSON object with the API Key, and further instructions.
- **/api/op?op=24*56&key=123593293283**    : Perform the operation. Only simple operations are allowed - with 2 operands and one operator in between.
The application returns a JSON object with the result (with a HTTP 200 status Header).

All Errors return with an HTTP 500 Header and an explanation in plain text.