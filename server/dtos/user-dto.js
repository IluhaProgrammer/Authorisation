module.exports = class UserDto {
    email;
    isactivated;
    id;

    constructor(candidate) {
        this.email = candidate.email;
        this.id = candidate.id;
        this.isactivated = candidate.isactivated;
    }
}