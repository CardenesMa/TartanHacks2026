import { Cell } from "../components/mosaicGen";
export function createSelectionController(polygons: Cell[], setPolygons: (p: Cell[]) => void) {
    let selectedId: string | null = null;

    return function handleSelection(clickedId: string | null) {
        if (selectedId === null) {
            selectedId = clickedId;
            setPolygons(polygons.map((poly: Cell) =>
                poly.id === clickedId
                    ? { ...poly, highlighted: true }
                    : poly
            ));
            return;
        }

        if (selectedId === clickedId) {
            selectedId = null;
            setPolygons(polygons.map((poly: Cell) => ({ ...poly, highlighted: false })));
            return;
        }

        // swap colors
        setPolygons(polygons.map((poly: Cell) => {
            return { ...poly, highlighted: false };
        }));

        selectedId = null;
    }
}
