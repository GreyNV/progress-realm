const AgeSystem = {
    daysPerYear: 365,
    addDays(days) {
        State.age.days += days;
        if (State.age.days >= this.daysPerYear) {
            State.age.years += Math.floor(State.age.days / this.daysPerYear);
            State.age.days = State.age.days % this.daysPerYear;
        }
        if (typeof PubSub !== 'undefined') {
            PubSub.publish('age:advanced', days);
        }
        if (!State.prestiging && State.age.years >= State.age.max) {
            if (typeof PubSub !== 'undefined') {
                PubSub.publish('age:maxReached');
            }
        }
    }
};

if (typeof module !== 'undefined') {
    module.exports = { AgeSystem };
}
