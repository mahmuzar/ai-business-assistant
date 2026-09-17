export abstract class ValueObject<Props extends object> {
    protected readonly props: Props;

    constructor(props: Props) {
        this.props = props;
    }

    equals(other: ValueObject<Props>): boolean {
        if (this.constructor !== other.constructor) {
            return false;
        }

        return JSON.stringify(this.props) === JSON.stringify(other.props);
    }
}