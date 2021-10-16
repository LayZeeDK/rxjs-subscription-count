const wallaby = require("./wallaby")
// @ponicode
describe("wallaby", () => {
    test("0", () => {
        let callFunction = () => {
            wallaby()
        }
    
        expect(callFunction).not.toThrow()
    })
})
