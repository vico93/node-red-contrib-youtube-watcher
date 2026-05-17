const helper = require("node-red-node-test-helper");
const youtubeWatchNode = require("../youtube-watch/youtube-watch.js");

describe("youtube-watch Node", function () {

    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it("should be loaded", function (done) {
        var flow = [{ id: "n1", type: "youtube-watch", name: "test name", channelId: "UCtest1234567890123456", interval: "15", maxResults: "8" }];
        helper.load(youtubeWatchNode, flow, function () {
            var n1 = helper.getNode("n1");
            n1.should.have.property("name", "test name");
            n1.should.have.property("channelId", "UCtest1234567890123456");
            n1.should.have.property("interval", 900000);
            n1.should.have.property("maxResults", 8);
            done();
        });
    });

    it("should have credentials loaded", function (done) {
        var flow = [{ id: "n1", type: "youtube-watch", channelId: "UCtest1234567890123456" }];
        var credentials = { "n1": { "apiKey": "my-secret-key" } };
        helper.load(youtubeWatchNode, flow, credentials, function () {
            var n1 = helper.getNode("n1");
            n1.credentials.should.have.property("apiKey", "my-secret-key");
            done();
        });
    });

    it("should set ignoreFirst flag", function (done) {
        var flow = [{ id: "n1", type: "youtube-watch", channelId: "UCtest1234567890123456", ignoreFirst: true }];
        helper.load(youtubeWatchNode, flow, function () {
            var n1 = helper.getNode("n1");
            n1.should.have.property("ignoreFirst", true);
            done();
        });
    });

    it("should clamp maxResults between 1 and 50", function (done) {
        var flow = [
            { id: "n1", type: "youtube-watch", channelId: "UCtest1234567890123456", maxResults: "0" },
            { id: "n2", type: "youtube-watch", channelId: "UCtest1234567890123456", maxResults: "100" }
        ];
        helper.load(youtubeWatchNode, flow, function () {
            var n1 = helper.getNode("n1");
            var n2 = helper.getNode("n2");
            n1.should.have.property("maxResults", 1);
            n2.should.have.property("maxResults", 50);
            done();
        });
    });
});
