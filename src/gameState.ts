export class GameState {
    public ducklingsFound: number;
    private totalDucklings: number; // Make it mutable via a method

    constructor() { // Remove default total from constructor
        this.ducklingsFound = 0;
        this.totalDucklings = 0; // Initialize to 0, set later
    }

    /**
     * Sets the total number of ducklings the player needs to find.
     * Should be called once during game initialization.
     * @param count The total number of ducklings.
     */
    public setTotalDucklings(count: number): void {
        if (this.totalDucklings === 0 && count > 0) { // Allow setting only once
            this.totalDucklings = count;
        } else if (count <= 0) {
            console.warn("Attempted to set total ducklings to a non-positive number.");
        } else {
            console.warn("Total ducklings already set.");
        }
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
        // Ensure totalDucklings is set before checking win condition
        return this.totalDucklings > 0 && this.ducklingsFound >= this.totalDucklings;
    }
}
