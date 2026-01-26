var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()

  // Make call to bot
  window.setTimeout(makeBotMove, 250)
}

function makeBotMove() {
    $status.text("XsusBot (Stockfish 17.1) myśli...")

    $.ajax({
        url: '/move',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fen: game.fen() }),
        success: function(response) {
            if (response.error) {
                alert("Error: " + response.error);
                return;
            }
            if (response.game_over) {
                 updateStatus();
                 return;
            }

            var bestMove = response.best_move;

            var from = bestMove.substring(0, 2);
            var to = bestMove.substring(2, 4);
            var promotion = bestMove.length === 5 ? bestMove.substring(4, 5) : undefined;

            game.move({
                from: from,
                to: to,
                promotion: promotion
            });

            board.position(game.fen());
            updateStatus();
        },
        error: function(err) {
            console.error(err);
            $status.text("Błąd połączenia z serwerem.");
        }
    });
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'Białe'
  if (game.turn() === 'b') {
    moveColor = 'Czarne'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Koniec gry, ' + moveColor + ' są w macie.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Koniec gry, remis.'
  }

  // game still on
  else {
    status = moveColor + ' (Twój ruch)'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' są w szachu'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('board', config)

updateStatus()

$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    updateStatus();
});

$('#flipBtn').on('click', function() {
    board.flip();
});
