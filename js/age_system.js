const AgeSystem = {
    daysPerYear: 365,
    addDays(days) {
        updateState(['age', 'days'], d => d + days);
        if (State.age.days >= this.daysPerYear) {
            updateState(['age', 'years'], y => y + Math.floor(State.age.days / this.daysPerYear));
            setState(['age', 'days'], State.age.days % this.daysPerYear);
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
