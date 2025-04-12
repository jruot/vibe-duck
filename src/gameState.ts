export class GameState {
    public ducklingsFound: number;
    private readonly totalDucklings: number;

    constructor(totalDucklings: number = 66) {
        this.ducklingsFound = 0;
        this.totalDucklings = totalDucklings;
    }

    public foundDuckling(): void {
        if (this.ducklingsFound < this.totalDucklings) {
            this.ducklingsFound++;
        }
    }

    public reset(): void {
        this.ducklingsFound = 0;
    }

    public get totalDucklingsCount(): number {
        return this.totalDucklings;
    }

    public get allDucklingsFound(): boolean {
        return this.ducklingsFound >= this.totalDucklings;
    }
}
