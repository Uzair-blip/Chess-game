
const socket = io();
const chess = new Chess();
const boardElem = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

const renderBoard = () => {
    const board = chess.board();
    boardElem.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElem = document.createElement("div");
            squareElem.classList.add(
                "flex",
                "items-center",
                "justify-center",
                (rowIndex + squareIndex) % 2 === 0 ? "bg-[#f0d9b5]" : "bg-[#b58863]"
            );
            squareElem.dataset.row = rowIndex;
            squareElem.dataset.col = squareIndex;

            if (square) {
                const pieceElem = document.createElement("div");
                pieceElem.classList.add("text-4xl", "cursor-pointer", square.color === 'w' ? "text-white" : "text-black");
                pieceElem.style.filter = square.color === 'w' ? "drop-shadow(0 0 2px rgba(0, 0, 0, 1))" : "";
                pieceElem.innerHTML = getPieceUnicode(square.type, square.color);
                pieceElem.draggable = playerRole === square.color;
                pieceElem.addEventListener("dragstart", function (e) {
                    if (pieceElem.draggable) {
                        draggedPiece = pieceElem;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", ""); 
                    }
                });
                pieceElem.addEventListener("dragend", function (e) {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElem.appendChild(pieceElem);
            }

            squareElem.addEventListener("dragover", (e) => {
                e.preventDefault();
            });
            squareElem.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElem.dataset.row),
                        col: parseInt(squareElem.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElem.appendChild(squareElem);
        });
    });
};

const getPieceUnicode = (type, color) => {
    const pieces = {
        p: { w: '♙', b: '♟' },
        r: { w: '♖', b: '♜' },
        n: { w: '♘', b: '♞' },
        b: { w: '♗', b: '♝' },
        q: { w: '♕', b: '♛' },
        k: { w: '♔', b: '♚' }
    };
    return pieces[type][color];
};

const handleMove = (source, target) => {
    const sourceSquare = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const targetSquare = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;
    const move = chess.move({ from: sourceSquare, to: targetSquare });

    if (move) {
        renderBoard();
        socket.emit("move", move);
    }
};

renderBoard();
