module.exports = class ServiceError extends Error {
    constructor(statusCode, message, error) {
        super()
        this.statusCode = statusCode
        this.message = message
        this.error = error
    }
}